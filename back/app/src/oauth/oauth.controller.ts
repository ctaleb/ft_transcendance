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
    console.log("Token in controller --> " + token);
    return token;
  }  
}
