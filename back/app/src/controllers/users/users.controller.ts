import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
  Redirect,
} from '@nestjs/common';
import { CreateUserDto } from 'src/dtos/user.dto';
import { UsersService } from '../../services/users/users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}
}
