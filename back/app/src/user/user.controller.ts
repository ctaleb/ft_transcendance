import { Body, Controller, HttpCode, HttpStatus, Post, Request, Response, UseGuards, Get, Param, ParseIntPipe, Res, } from '@nestjs/common';
import { UserEntity } from 'src/user/user.entity';
import { RegistrationDto } from 'src/authentication/registration.dto';
import { CreateUserDto } from 'src/user/user.dto';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/authentication/jwt-auth.guard';
import { read } from 'fs';
import { Observable, of } from 'rxjs';
import { join } from 'path';

@Controller('user')
export class UserController {
  constructor(private readonly _userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
     return req.user;
    }
  @Get('profile-picture/assets/:imagename')
  getPicture(@Param('imagename') imagename, @Res() res): Observable<Object> {
    return of(res.sendFile(join(process.cwd(), "/assets/" + imagename)));
  }
  @Get(':id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return this._userService.getUserById(id);
  }
  @Get('bynickname/:nickname')
  async getUserByNickname(@Param('nickname') nickname: string) {
    return this._userService.getUserByNickname(nickname);
  }
  @Get()
  getAllUsers(){
    return this._userService.getAllUsers();
  }
}

