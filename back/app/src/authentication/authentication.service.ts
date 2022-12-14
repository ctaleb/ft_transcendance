import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { unlink } from 'fs';
import { RegistrationDto } from 'src/authentication/registration.dto';
import { PostgresErrorCode } from 'src/database/errors.constraint';
import { ImageDto } from 'src/image/image.dto';
import { UserEntity } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';
import { DataSource } from 'typeorm';
import { check_magic_numbers } from '../utils/file-uploading.utils';

@Injectable()
export class AuthenticationService {
  constructor(private readonly _userService: UserService, private readonly _dataSource: DataSource, private jwtService: JwtService) {}

  async registration(registrationDto: RegistrationDto, imageDto: ImageDto, reg42: boolean): Promise<UserEntity> {
    if (!reg42 && !(await check_magic_numbers(imageDto.path))) throw new UnauthorizedException('Mimetype');
    let user: UserEntity;
    const queryRunner = this._dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      user = await this._userService.createUser(registrationDto);
      user = await this._userService.setAvatar(user.id, imageDto);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (imageDto && imageDto.filename != 'pizz.jpeg') {
        unlink(imageDto.path, (err) => {
          if (err) throw err;
        });
      }
      if (error?.code === PostgresErrorCode.UniqueViolation) {
        throw new UnauthorizedException('Nickname already exists');
      }
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
    return user;
  }

  async validateUser(username: string, plainPassword: string): Promise<any> {
    const user = await this._userService.getUserByNickname(username).catch(() => {
      return null;
    });
    if (user) {
      if (bcrypt.compareSync(plainPassword, user.password)) {
        const { password, ...ret } = user;
        return ret;
      }
    }
    return null;
  }

  async login(user: any) {
    return {
      access_token: this.jwtService.sign(user),
    };
  }
}
