import {
  Controller,
  Get,
  Body,
  Post,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/authentication/jwt-auth.guard';
import { ServerService } from './server.service';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly _serverService: ServerService) {}

  @Get('match-history/:name')
  async matchHistory(@Request() req, @Param() p: string) {
    return await this._serverService.getMatchHistory(p);
  }
}
