
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthController } from './auth.controller';
import authConfig from '../../config/auth.config';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [
        ConfigModule.forFeature(authConfig),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        PrismaModule,
    ],
    controllers: [AuthController],
    providers: [JwtStrategy],
    exports: [PassportModule],
})
export class AuthModule { }
