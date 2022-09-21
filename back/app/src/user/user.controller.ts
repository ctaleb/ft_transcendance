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
  Put,
  Param,
  ParseIntPipe,
  Res,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
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
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { editFileName, imageFileFilter } from 'src/utils/file-uploading.utils';
import { updatePasswordDto } from './dto/updatePassword';

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
    return ret;
  }
  @Get()
  getAllUsers() {
    return this._userService.getAllUsers();
  }

  @Post('setIntraAvatar/:id/:filename')
  async setAvatar(@Param('id') id: number, @Param('filename') filename: string){
    console.log("user id:" + id);
    let path = "./assets/" + filename;
    let file = {filename: filename, path: path, mimetype: "image/jpeg"};
    return this._userService.setAvatar(id, file);
  }

  //PROFILE EDITION
  @Put('nicknameEdit/:oldNickname/:newNickname')
  async editNickname(@Param('oldNickname') oldNickname: string, @Param('newNickname') newNickname: string) {
    return this._userService.updateNickname(oldNickname, newNickname);
  }

  @Put('avatarEdit/:userId')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './assets',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async editAvatar(@UploadedFile() avatar: Express.Multer.File, @Param('userId') userId: number){
    console.log("in editAvatar:" + JSON.stringify(avatar));
    return this._userService.updateAvatar(avatar ?{
      filename: avatar.originalname,
      path: avatar.path,
      mimetype: avatar.mimetype
    }: null,
    userId);

  }

  @Put('passwordEdit/:userId')
  async editPassword(@Param('userId') userId: number, @Body() newPasswordDto: updatePasswordDto) {
    
    return this._userService.updatePassword(newPasswordDto.newPassword, userId);
  }
}
