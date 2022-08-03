import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/users.module';
import { AuthenticationController } from 'src/controllers/authentication/authentication.controller';
import { AuthenticationService } from 'src/services/authentication/authentication.service';
import { UserEntity } from 'src/model/user.entity';
import { UsersService } from './services/users/users.service';

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([UserEntity])],
  providers: [AuthenticationService, UsersService],
  controllers: [AuthenticationController],
})
export class AuthenticationModule {}
