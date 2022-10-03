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
    @UploadedFile() avatar: Express.Multer.File,
    @Body() registrationDto: RegistrationDto,
  ): Promise<UserEntity> {
    return this._authenticationService.registration(
      registrationDto,
      avatar
        ? {
            path: avatar.path,
            filename: avatar.originalname,
            mimetype: avatar.mimetype,
          }
        : null,
    );
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req, @Response({ passthrough: true }) res) {
    const token = this._authenticationService.login(req.user);
<<<<<<< HEAD
=======
    this.serverService.newUser((await token).access_token, req.user);
    this.serverService.playerList.forEach((element) => {
      console.log(element.name + ' - ' + element.socket);
    });
>>>>>>> 65c496d76483b753e18d5c0fad70626c0cfbfead
    return { token: (await token).access_token, user: req.user };
  }
}
