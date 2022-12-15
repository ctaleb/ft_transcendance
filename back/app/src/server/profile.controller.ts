import { Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/authentication/jwt-auth.guard';
import { ServerService } from './server.service';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly _serverService: ServerService) {}

  @Get('/summary/:name')
  async matchHistory(@Request() req, @Param('name') name: string) {
    return await this._serverService.getMatchHistory(name);
  }

  @Get('/summary')
  async matchOwnHistory(@Request() req) {
    return await this._serverService.getMatchHistory(req.user.payload.nickname);
  }
}
