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
  @UseGuards(JwtAuthGuard)
  @Get('profile-picture/assets/:imagename')
  getPicture(@Param('imagename') imagename, @Res() res): Observable<Object> {
    return of(res.sendFile(join(process.cwd(), '/assets/' + imagename)));
  }
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return this._userService.getUserById(id);
  }
  @UseGuards(JwtAuthGuard)
  @Get('bynickname/:nickname')
  async getUserByNickname(@Param('nickname') nickname: string) {
    return this._userService.getUserByNickname(nickname);
  }
  //@UseGuards(JwtAuthGuard)
  @Get('findIntraUser/:intraId')
  async getIntraUserById(@Param('intraId') intraId: string) {
    const ret = await this._userService.getIntraUserById(intraId);
    return ret;
  }
  @UseGuards(JwtAuthGuard)
  @Get()
  getAllUsers() {
    return this._userService.getAllUsers();
  }

  //can be useful if the client call it with token
  //  @Post('setIntraAvatar/:id/:filename')
  //  async setAvatar(
  //    @Param('id') id: number,
  //    @Param('filename') filename: string,
  //  ) {
  //    const path = './assets/' + filename;
  //    const file = { filename: filename, path: path, mimetype: 'image/jpeg' };
  //    return this._userService.setAvatar(id, file);
  //  }

  //PROFILE EDITION
  @UseGuards(JwtAuthGuard)
  @Put('nicknameEdit/:newNickname')
  async editNickname(
    @Request() req,
    @Param('newNickname') newNickname: string,
  ) {
    return this._userService.updateNickname(
      req.user.payload.nickname,
      newNickname,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Put('avatarEdit/')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './assets',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async editAvatar(
    @UploadedFile() avatar: Express.Multer.File,
    @Request() req,
  ) {
    return this._userService.updateAvatar(
      avatar
        ? {
            filename: avatar.originalname,
            path: avatar.path,
            mimetype: avatar.mimetype,
          }
        : null,
      req.user.payload.id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Put('passwordEdit')
  async editPassword(
    @Request() req,
    @Body() newPasswordDto: updatePasswordDto,
  ) {
    return this._userService.updatePassword(
      newPasswordDto.newPassword,
      req.user.payload.id,
    );
  }
}
