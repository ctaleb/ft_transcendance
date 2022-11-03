import { UseGuards } from '@nestjs/common';
import {
  Controller,
  Request,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/authentication/jwt-auth.guard';
import { User } from 'src/server/entities/server.entity';
import { UserEntity } from 'src/user/user.entity';
import { PrivateConvEntity } from './entities/private_conv.entity';
import { PrivateConvService } from './private_conv.service';

@Controller('privateConv')
export class PrivateConvController {
  constructor(private readonly privateConvService: PrivateConvService) {}

  @UseGuards(JwtAuthGuard)
  @Get('getAllConvs')
  async getAllConvs(@Request() req): Promise<PrivateConvEntity[]> {
    return await this.privateConvService.getAllConvs(req.user.payload.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('getMessages/:convUuid')
  async getMessages(@Param('convUuid') convUuiD) {
    console.log('uuid --> ' + convUuiD);
    return await this.privateConvService.getMessages(convUuiD);
  }
}
