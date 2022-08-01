import {
  Body,
  Get,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
  Res,
} from '@nestjs/common';
import { CreateUserDto } from 'src/users/dtos/CreateUser.dto';
import {  Request, Response, } from 'express';
import { LoginUserDto } from 'src/users/dtos/LoginUser.dto';
import { UsersService } from '../../services/users/users.service';
import { faker } from '@faker-js/faker';

import User from 'src/model/user.entity';
import { get } from 'http';
import { last } from 'rxjs';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.getAllUsers();
  }

  @Post('create')
  @UsePipes(ValidationPipe)
  createUser(@Body() createUserDto: CreateUserDto) {
    this.usersService.createUser(createUserDto);
  }
  @Post('create/faker')
  FakeUser(@Res() response: Response) {
    const fakeUser = {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
    };
    this.usersService.createUser(fakeUser);
    response.redirect('/register');
  }

  @Post('login')
  loginUser(@Body() loginUserDto: LoginUserDto, @Res() response: Response) {
    response.redirect('/');
    return this.usersService.loginUser(loginUserDto);
  }
}
