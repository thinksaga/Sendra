
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserContext } from '../../../../../packages/types/src/auth/user-context';
import { WorkspacesService } from './workspaces.service';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
    constructor(private readonly workspacesService: WorkspacesService) { }

    @Get()
    async findAll(@CurrentUser() user: UserContext) {
        return this.workspacesService.findAllForUser(user.id);
    }

    @Post()
    async create(
        @CurrentUser() user: UserContext,
        @Body('name') name: string,
        @Body('slug') slug: string
    ) {
        return this.workspacesService.create(user.id, name, slug);
    }
}
