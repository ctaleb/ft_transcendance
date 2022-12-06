import { forwardRef, Module } from '@nestjs/common';
import { FriendshipService } from './friendship.service';
import { FriendshipController } from './friendship.controller';
import { UserService } from 'src/user/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendshipEntity } from './entities/friendship.entity';
import { UserEntity } from 'src/user/user.entity';
import { ImageModule } from 'src/image/image.module';
import { ServerService } from 'src/server/server.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { jwtConstants } from 'src/authentication/constants';
import { ServerModule } from 'src/server/server.module';
import { UserModule } from 'src/user/user.module';

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
