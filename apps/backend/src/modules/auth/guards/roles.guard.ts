
import { Injectable, CanActivate, ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WorkspaceRole } from '../../../../../../packages/types/src/auth/workspace-context';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: WorkspaceRole[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<WorkspaceRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            return true; // No specific role required, just membership (handled by WorkspaceGuard)
        }

        const request = context.switchToHttp().getRequest();
        const workspaceContext = request.workspace;

        if (!workspaceContext) {
            throw new ForbiddenException('Workspace context missing. Ensure WorkspaceGuard is used.');
        }

        const hasRole = this.checkRoleHierarchy(workspaceContext.role, requiredRoles);

        if (!hasRole) {
            throw new ForbiddenException(`Insufficient permissions. Required: ${requiredRoles.join(', ')}`);
        }

        return true;
    }

    // Simple hierarchy check: OWNER > ADMIN > MEMBER > READ_ONLY
    private checkRoleHierarchy(userRole: WorkspaceRole, requiredRoles: WorkspaceRole[]): boolean {
        if (requiredRoles.includes(userRole)) return true;

        // Hierarchy logic (simplified)
        const hierarchy = {
            [WorkspaceRole.OWNER]: 4,
            [WorkspaceRole.ADMIN]: 3,
            [WorkspaceRole.MEMBER]: 2,
            [WorkspaceRole.READ_ONLY]: 1,
        };

        const userLevel = hierarchy[userRole] || 0;
        // If ANY required role is met by hierarchy, valid.
        // E.g. required is ADMIN, user is OWNER (4 >= 3) -> True.
        return requiredRoles.some(role => userLevel >= hierarchy[role]);
    }
}
