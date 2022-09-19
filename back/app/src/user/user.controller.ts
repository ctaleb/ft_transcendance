import { Body, Controller, HttpCode, HttpStatus, Post, Request, Response, UseGuards, Get, Param, ParseIntPipe, Res, } from '@nestjs/common';
import { UserEntity } from 'src/user/user.entity';
import { RegistrationDto } from 'src/authentication/registration.dto';
import { CreateUserDto } from 'src/user/user.dto';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/authentication/jwt-auth.guard';
import { read } from 'fs';
import { Observable, of } from 'rxjs';
import { join } from 'path';
import { get } from 'http';
import { ImageDto } from 'src/image/image.dto';

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
  @Get('findIntraUser/:intraId')
  async getIntraUserById(@Param('intraId') intraId: string) {
    let ret = await this._userService.getIntraUserById(intraId);
    console.log("USER IN CONTROLLER -- " + JSON.stringify(ret));
    return ret;
  }
  @Get()
  getAllUsers(){
    return this._userService.getAllUsers();
  }

  @Post('setIntraAvatar/:id/:filename')
  async setAvatar(@Param('id') id: number, @Param('filename') filename: string){
    let path = "./assets/" + filename;
    let file = {filename: filename, path: path, mimetype: "image/jpeg"};
    console.log(id);
    return this._userService.setAvatar(id, file);
  }
}

