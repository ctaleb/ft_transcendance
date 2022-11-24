import { Controller, Param, Post } from '@nestjs/common';
import { OauthService } from './oauth.service';

@Controller('oauth')
export class OauthController {
  constructor(private readonly oauthService: OauthService) {}

  @Post(':code')
  async connect(@Param('code') code: string) {
    const token = await this.oauthService.connect(code);
    return token;
  }

  @Post('login/:access_token')
  async login(@Param('access_token') access_token: string) {
    const result = await this.oauthService.login(access_token);
    return { token: result.token, user: result.user };
  }
}
