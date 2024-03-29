import {
  Body,
  Request,
  UseGuards,
  Response,
  ConsoleLogger,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
  Inject,
  UnauthorizedException,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { UserEntity } from 'src/user/user.entity';
import { RegistrationDto } from 'src/authentication/registration.dto';
import { AuthenticationService } from 'src/authentication/authentication.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { LocalAuthGuard } from './local-auth.guard';
import { editFileName, imageFileFilter } from 'src/utils/file-uploading.utils';
import { ServerService } from '../server/server.service';

@Controller('authentication')
export class AuthenticationController {
  @Inject(ServerService)
  private readonly serverService: ServerService;
  constructor(private readonly _authenticationService: AuthenticationService) {}

  @Post('registration')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './assets',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async registration(
    @UploadedFile()
    avatar: Express.Multer.File,
    @Body() registrationDto: RegistrationDto,
  ): Promise<UserEntity> {
    if (registrationDto.nickname.length > 15) throw new UnauthorizedException('Nickname too long');
    return this._authenticationService.registration(
      registrationDto,
      avatar
        ? {
            path: avatar.path,
            filename: avatar.originalname,
            mimetype: avatar.mimetype,
          }
        : {
            path: 'assets/pizz.jpeg',
            filename: 'pizz.jpeg',
            mimetype: 'image/jpeg',
          },
      false,
    );
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    const token = this._authenticationService.login(req.user);
    await this.serverService.newUser((await token).access_token, req.user.nickname);
    return { token: (await token).access_token, user: req.user };
  }
}
