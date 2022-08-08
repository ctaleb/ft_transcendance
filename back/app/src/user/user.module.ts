import { Module } from '@nestjs/common';
import { UserController } from 'src/user/user.controller';
import { UserService } from 'src/user/user.service';
import { UserEntity } from './user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticationModule } from 'src/authentication/authentication.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [UserController],
  providers: [UserService],
})
export class UsersModule {}
