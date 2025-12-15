
import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { UserContext } from '../../../../../../packages/types/src/auth/user-context';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    private readonly logger = new Logger(JwtStrategy.name);

    constructor(
        configService: ConfigService,
        private prisma: PrismaService,
    ) {
        const issuer = configService.get<string>('auth.keycloakIssuer');
        if (!issuer) throw new Error('KEYCLOAK_ISSUER_URL is not defined');

        super({
            secretOrKeyProvider: passportJwtSecret({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 5,
                jwksUri: `${issuer}/protocol/openid-connect/certs`,
            }),
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            audience: configService.get<string>('auth.audience'), // Optional validation
            issuer: issuer,
            algorithms: ['RS256'],
        });
    }

    async validate(payload: any): Promise<UserContext> {
        // Sync or Fetch User
        let user = await this.prisma.user.findUnique({
            where: { keycloakId: payload.sub }
        });

        if (!user) {
            this.logger.log(`Creating new user for ${payload.email} (${payload.sub})`);
            user = await this.prisma.user.create({
                data: {
                    keycloakId: payload.sub,
                    email: payload.email,
                    name: payload.name || payload.preferred_username || 'User'
                }
            });
        }

        return {
            id: user.id,
            keycloakId: user.keycloakId,
            email: user.email,
            email_verified: payload.email_verified,
            resource_access: payload.resource_access,
            realm_access: payload.realm_access,
        };
    }
}
