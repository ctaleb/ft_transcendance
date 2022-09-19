import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OauthService } from './oauth.service';
import { CreateOauthDto } from './dto/create-oauth.dto';
import { UpdateOauthDto } from './dto/update-oauth.dto';

@Controller('oauth')
export class OauthController {
  constructor(private readonly oauthService: OauthService) {}

  @Post(':code')
  async connect(@Param('code') code: string) {
    let token =  await this.oauthService.connect(code);
    return token;
  }

  @Post('login/:access_token')
  async login(@Param('access_token') access_token: string) {
    let result =  await this.oauthService.login(access_token);
    return {token: result.token, user: result.user};
  }
}
