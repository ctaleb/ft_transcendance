import { Controller, Param, Post } from '@nestjs/common';

import { TwoFactorService } from './twoFactorAuth.service';

@Controller('twofactor')
export class twoFactorController {
  constructor(private readonly twoFactorService: TwoFactorService) {}

  @Post('sendCode/:phone')
  async sendCode(@Param('phone') phone: string) {
    return await this.twoFactorService.sendCode(phone);
  }
  @Post('verifyCode/:code')
  async verifyCode(@Param('code') code: string) {
    return await this.twoFactorService.verifyCode(code);
  }
}
