
import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceRole } from '../../../../../packages/types/src/auth/workspace-context'; // Path to shared types
import { randomBytes } from 'crypto';

@Injectable()
export class InvitesService {
    constructor(private prisma: PrismaService) { }

    // Generate a secure random token
    private generateToken(): string {
        return randomBytes(32).toString('hex');
    }

    // 1. Create Invite
    async createInvite(workspaceId: string, createdById: string, email: string, role: WorkspaceRole) {
        // Check if user is already a member
        const existingMember = await this.prisma.workspaceMember.findFirst({
            where: {
                workspaceId,
                user: { email: email }
            }
        });

        if (existingMember) {
            throw new ConflictException('User is already a member of this workspace');
        }

        // Check for existing pending invite
        const existingInvite = await this.prisma.workspaceInvite.findUnique({
            where: {
                workspaceId_email: {
                    workspaceId,
                    email,
                },
            },
        });

        if (existingInvite && existingInvite.expiresAt > new Date()) {
            throw new ConflictException('Valid invite already exists for this email');
        }

        // Delete expired or previous invite if exists to allow re-invite
        if (existingInvite) {
            await this.prisma.workspaceInvite.delete({ where: { id: existingInvite.id } });
        }

        const token = this.generateToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

        return this.prisma.workspaceInvite.create({
            data: {
                workspaceId,
                createdById,
                email,
                role,
                token,
                expiresAt,
            },
        });
    }

    // 2. List Pending Invites
    async getPendingInvites(workspaceId: string) {
        return this.prisma.workspaceInvite.findMany({
            where: {
                workspaceId,
                acceptedAt: null,
                expiresAt: { gt: new Date() },
            },
            include: {
                createdBy: {
                    select: { name: true, email: true }
                }
            }
        });
    }

    // 3. Revoke Invite
    async revokeInvite(workspaceId: string, inviteId: string) {
        const invite = await this.prisma.workspaceInvite.findUnique({
            where: { id: inviteId }
        });

        if (!invite || invite.workspaceId !== workspaceId) {
            throw new NotFoundException('Invite not found');
        }

        return this.prisma.workspaceInvite.delete({
            where: { id: inviteId },
        });
    }

    // 4. Accept Invite
    async acceptInvite(token: string, userId: string) {
        const invite = await this.prisma.workspaceInvite.findUnique({
            where: { token },
        });

        if (!invite) {
            throw new NotFoundException('Invalid invite token');
        }

        if (invite.expiresAt < new Date()) {
            throw new BadRequestException('Invite has expired');
        }

        if (invite.acceptedAt) {
            throw new BadRequestException('Invite already accepted');
        }

        // Wrap in transaction: Add Member + Update Invite
        return this.prisma.$transaction(async (tx) => {
            // Create Membership
            await tx.workspaceMember.create({
                data: {
                    userId,
                    workspaceId: invite.workspaceId,
                    role: invite.role,
                },
            });

            // Mark as accepted
            return tx.workspaceInvite.update({
                where: { id: invite.id },
                data: {
                    acceptedAt: new Date(),
                },
            });
        });
    }
}
