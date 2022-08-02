import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
  Redirect
} from '@nestjs/common';
import { CreateUserDto } from 'src/dtos/CreateUser.dto';
import { UsersService } from '../../services/users/users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('create')
  @Redirect('/')
  @UsePipes(ValidationPipe)
  createUser(@Body() createUserDto: CreateUserDto) {
    this.usersService.createUser(createUserDto);
  }
}
