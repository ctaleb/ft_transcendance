import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  Response,
  UseGuards,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { UserEntity } from 'src/user/user.entity';
import { RegistrationDto } from 'src/authentication/registration.dto';
import { CreateUserDto } from 'src/user/user.dto';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/authentication/jwt-auth.guard';
import { read } from 'fs';

@Controller('user')
export class UserController {
  constructor(private readonly _userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return req.user;
  }

  @Get(':id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return this._userService.getUserById(id);
  }
}
