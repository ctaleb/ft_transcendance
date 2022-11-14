import { Controller, Param, Post } from '@nestjs/common';

import { TwoFactorService } from './twoFactorAuth.service';

@Controller('twofactor')
export class twoFactorController {
  constructor(private readonly twoFactorService: TwoFactorService) {}

  @Post('step2/:phone')
  async login2fa(@Param('phone') phone: string) {
    return await this.twoFactorService.steptwo(phone);
  }
}
