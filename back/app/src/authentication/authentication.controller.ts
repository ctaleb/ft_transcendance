import { Body, Controller, HttpCode, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
import { UserEntity } from 'src/user/user.entity';
import { RegistrationDto } from 'src/authentication/registration.dto';
import { AuthenticationService } from 'src/authentication/authentication.service';
import { LocalAuthGuard } from './local-auth.guard';

@Controller('Authentication')
export class AuthenticationController {
  constructor(private readonly _authenticationService: AuthenticationService) {}

  @Post('registration')
  @HttpCode(HttpStatus.OK)
  async registration(
    @Body() registrationDto: RegistrationDto,
  ): Promise<UserEntity> {
    return this._authenticationService.registration(registrationDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this._authenticationService.login(req.user);
  }
}

