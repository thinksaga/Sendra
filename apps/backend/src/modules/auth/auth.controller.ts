
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserContext } from '../../../../../packages/types/src/auth/user-context';

@Controller('auth')
export class AuthController {
    @Get('me')
    @UseGuards(JwtAuthGuard)
    getProfile(@CurrentUser() user: UserContext) {
        return {
            message: 'You are authenticated!',
            user,
        };
    }

    @Get('public')
    getPublic() {
        return { message: 'This is public' };
    }
}
