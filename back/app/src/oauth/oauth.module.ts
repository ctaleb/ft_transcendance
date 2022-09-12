import { Module } from '@nestjs/common';
import { OauthService } from './oauth.service';
import { OauthController } from './oauth.controller';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from 'src/authentication/constants';

@Module({
  imports: [
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '10d' },
    }),
  ],
  controllers: [OauthController],
  providers: [OauthService],
})
export class OauthModule {}
