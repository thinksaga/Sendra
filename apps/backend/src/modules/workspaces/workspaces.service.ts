
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkspacesService {
    constructor(private prisma: PrismaService) { }

    async findAllForUser(userId: string) {
        const workspaces = await this.prisma.workspace.findMany({
            where: {
                members: {
                    some: {
                        userId
                    }
                }
            },
            include: {
                members: true
            }
        });

        if (workspaces.length === 0) {
            const defaultWorkspace = await this.create(userId, 'My Workspace', `ws-${userId.substring(0, 8)}`);
            return [defaultWorkspace];
        }

        return workspaces;
    }

    async create(userId: string, name: string, slug: string) {
        return this.prisma.$transaction(async (tx) => {
            const workspace = await tx.workspace.create({
                data: {
                    name,
                    slug,
                    members: {
                        create: {
                            userId,
                            role: 'OWNER'
                        }
                    }
                }
            });
            return workspace;
        });
    }
}
