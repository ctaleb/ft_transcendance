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
import { UserService } from 'src/user/user.service';
import { PrivateConvEntity } from './entities/private_conv.entity';
import { PrivateConvService } from './private_conv.service';

@Controller('privateConv')
export class PrivateConvController {
  constructor(
    private readonly privateConvService: PrivateConvService,
    private readonly userService: UserService,
  ) {}

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

  @UseGuards(JwtAuthGuard)
  @Get('createConv/:friend')
  async createConv(@Request() req, @Param('friend') friendNickname) {
    let convCreated = false;
    const user1 = await this.userService.getUserByNickname(
      req.user.payload.nickname,
    );
    const user2 = await this.userService.getUserByNickname(friendNickname);
    const conv = this.privateConvService
      .getConv(user1, user2)
      .catch(async () => {
        convCreated = true;
        return await this.privateConvService.createConv(user1, user2);
      });
    return { conv: conv, created: convCreated };
  }
}
