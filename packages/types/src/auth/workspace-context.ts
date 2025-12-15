
import { UserContext } from './user-context';

export enum WorkspaceRole {
    OWNER = 'OWNER',
    ADMIN = 'ADMIN',
    MEMBER = 'MEMBER',
    READ_ONLY = 'READ_ONLY',
}

export interface WorkspaceContext {
    workspaceId: string;
    role: WorkspaceRole;
}

// Extend the Request type to include workspace context
declare global {
    namespace Express {
        interface Request {
            user?: UserContext;
            workspace?: WorkspaceContext;
        }
    }
}
