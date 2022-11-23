import { Controller, Get, Param, ParseIntPipe, Request, UnprocessableEntityException, UseGuards } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
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
  @Get('getMessages/:id/:offset')
  async getMessages(@Request() req, @Param('id') id, @Param('offset') offset: number) {
    const conv = await this.privateConvService.getJoinedConv(req.user.payload.id, id);
    return await conv.messages;
  }

  @UseGuards(JwtAuthGuard)
  @Get('create/:friend')
  async createConv(@Request() req, @Param('friend', ParseIntPipe) friend: number) {
    const current = req.user.payload.id;
    let convCreated = false;

    const conv = await this.privateConvService.getConv(current, friend).catch(async () => {
      convCreated = true;
      return await this.privateConvService.createConv(current, friend);
    });
    return { conv: instanceToPlain(conv, { groups: [current === conv.user1.id ? 'user2' : ''] }), created: convCreated };
  }
}
