import { Body, Controller, HttpCode, HttpStatus, Post, Request, UseGuards, Get } from '@nestjs/common';
import { UserEntity } from 'src/user/user.entity';
import { RegistrationDto } from 'src/authentication/registration.dto';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/authentication/jwt-auth.guard';
import { read } from 'fs';

@Controller('user')
export class UserController {
  constructor(private readonly _userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    console.log("Cookies received:");
    console.log(req.cookies);
    return req.user;
  }
}

