import { Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/authentication/jwt-auth.guard';
import { UserService } from 'src/user/user.service';
import { PrivateConvEntity } from './entities/private_conv.entity';
import { PrivateConvService } from './private_conv.service';

@Controller('privateConv')
export class PrivateConvController {
  constructor(private readonly privateConvService: PrivateConvService, private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('getAllConvs')
  async getAllConvs(@Request() req): Promise<PrivateConvEntity[]> {
    return await this.privateConvService.getAllConvs(req.user.payload.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('getMessages/:convUuid/:offset')
  async getMessages(@Request() req, @Param('convUuid') convUuid, @Param('offset') offset: number) {
    const conv = await this.privateConvService.getJoinedConv(req.user.payload.id, convUuid);
    return await this.privateConvService.getMessages(conv, offset);
  }

  @UseGuards(JwtAuthGuard)
  @Get('createConv/:friend')
  async createConv(@Request() req, @Param('friend') friendNickname) {
    let convCreated = false;
    const user1 = await this.userService.getUserByNickname(req.user.payload.nickname);
    const user2 = await this.userService.getUserByNickname(friendNickname);
    const conv = await this.privateConvService.getConv(user1, user2).catch(async () => {
      convCreated = true;
      return await this.privateConvService.createConv(user1, user2);
    });
    return { conv: conv, created: convCreated };
  }
}
