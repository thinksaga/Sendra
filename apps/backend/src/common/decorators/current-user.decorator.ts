
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserContext } from '../../../../../packages/types/src/auth/user-context';

export const CurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): UserContext => {
        const request = ctx.switchToHttp().getRequest();
        return request.user;
    },
);
