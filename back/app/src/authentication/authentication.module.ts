import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/user/user.module';
import { AuthenticationController } from 'src/authentication/authentication.controller';
import { AuthenticationService } from 'src/authentication/authentication.service';
import { UserEntity } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([UserEntity])],
  providers: [AuthenticationService, UserService],
  controllers: [AuthenticationController],
})
export class AuthenticationModule {}
