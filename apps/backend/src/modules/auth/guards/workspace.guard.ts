
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkspaceRole } from '../../../../../../packages/types/src/auth/workspace-context';

@Injectable()
export class WorkspaceGuard implements CanActivate {
    private readonly logger = new Logger(WorkspaceGuard.name);

    constructor(private prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // 1. Verify User Authentication (Should be used after JwtAuthGuard)
        if (!user || !user.keycloakId) {
            throw new UnauthorizedException('User not authenticated');
        }

        // 2. Extract Workspace ID (Header priority, then Params)
        // Convention: X-Workspace-ID header or :workspaceId property in route params
        const workspaceId = request.headers['x-workspace-id'] || request.params.workspaceId;

        if (!workspaceId) {
            throw new ForbiddenException('Workspace ID not provided');
        }

        // 3. Verify Membership in DB
        const membership = await this.prisma.workspaceMember.findUnique({
            where: {
                userId_workspaceId: {
                    userId: user.id, // We assume user.id is populated by logic upstream (e.g. via a UserMiddleware or UserService lookup if not yet in token)
                    // NOTE: If user.id is NOT in token yet, we must find it via keycloakId.
                    // For safety in this MVP, let's lookup by keycloakId via User relation if needed, or assume ID is consistent.
                    // Let's do a safe lookup here.
                    workspaceId: workspaceId,
                },
            },
            // However, composite key requires internal IDs.
            // Let's relax and find by User.keycloakId if user.id isn't guaranteed matches DB internal ID yet (ref auth strategy).
        });

        // Let's fix the logic: We need to find the internal User ID first if it's not strictly reliable from token
        // OR we just query:
        const memberRecord = await this.prisma.workspaceMember.findFirst({
            where: {
                workspaceId: workspaceId,
                user: {
                    keycloakId: user.keycloakId
                }
            },
            select: {
                role: true,
                workspaceId: true
            }
        });

        if (!memberRecord) {
            this.logger.warn(`User ${user.keycloakId} attempted to access workspace ${workspaceId} without membership`);
            throw new ForbiddenException('Access to workspace denied');
        }

        // 4. Attach Context
        request.workspace = {
            workspaceId: memberRecord.workspaceId,
            role: memberRecord.role as WorkspaceRole,
        };

        return true;
    }
}
