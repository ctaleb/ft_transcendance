import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { UserEntity } from 'src/model/user.entity';
import { RegistrationDto } from 'src/dtos/registration.dto';
import { AuthenticationService } from 'src/services/authentication/authentication.service';

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
}
