import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    private readonly logger = new Logger(JwtAuthGuard.name);

    constructor(private prisma: PrismaService) {
        super();
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        // DEV BYPASS
        if ((process.env.NODE_ENV !== 'production' && authHeader === 'Bearer mock-token') || (process.env.NODE_ENV === 'test')) {
            this.logger.warn('Using MOCK AUTH TOKEN');

            // Ensure Dev User Exists
            let user = await this.prisma.user.findUnique({ where: { keycloakId: 'dev-user' } });
            if (!user) {
                user = await this.prisma.user.create({
                    data: {
                        keycloakId: 'dev-user',
                        email: 'dev@example.com',
                        name: 'Dev User'
                    }
                });
            }

            request.user = {
                id: user.id,
                keycloakId: user.keycloakId,
                email: user.email,
                name: user.name,
                email_verified: true,
            };
            return true;
        }

        return super.canActivate(context) as Promise<boolean>;
    }
}
