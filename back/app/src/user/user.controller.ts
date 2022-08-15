import { Body, Controller, HttpCode, HttpStatus, Post, Request, Response, UseGuards, Get, UseFilters,  } from '@nestjs/common';
import { UserEntity } from 'src/user/user.entity';
import { RegistrationDto } from 'src/authentication/registration.dto';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/authentication/jwt-auth.guard';
import { read } from 'fs';
import { HttpExceptionFilter } from './auth-exception.filter';

@Controller('user')
export class UserController {
  constructor(private readonly _userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @UseFilters(HttpExceptionFilter)
  @Get('profile')
  async getProfile(@Request() req) {
     return req.user;
  }
}

