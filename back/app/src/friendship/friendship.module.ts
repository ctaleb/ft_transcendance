import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { jwtConstants } from 'src/authentication/constants';
import { ImageModule } from 'src/image/image.module';
import { UserModule } from 'src/user/user.module';
import { FriendshipEntity } from './entities/friendship.entity';
import { FriendshipController } from './friendship.controller';
import { FriendshipService } from './friendship.service';

@Module({
  imports: [
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '10d' },
    }),
    TypeOrmModule.forFeature([FriendshipEntity]),
    ImageModule,
    UserModule,
  ],
  controllers: [FriendshipController],
  providers: [FriendshipService, JwtService],
})
export class FriendshipModule {}
