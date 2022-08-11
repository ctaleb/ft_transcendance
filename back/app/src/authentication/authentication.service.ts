import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PostgresErrorCode } from 'src/database/errors.constraint';
import { UserService } from 'src/user/user.service';
import { DataSource } from 'typeorm';
import { RegistrationDto } from 'src/authentication/registration.dto';
import { UserEntity } from 'src/user/user.entity';
import { UserAlreadyExistException } from 'src/authentication/authentication.exception';
import { InjectRepository } from '@nestjs/typeorm';
import { ImageDto } from 'src/image/image.dto';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly _userService: UserService,
    private readonly _dataSource: DataSource,
  ) {}

  async registration(
    registrationDto: RegistrationDto,
    imageDto: ImageDto,
  ): Promise<UserEntity> {
    let user: UserEntity;
    const queryRunner = this._dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      user = await this._userService.createUser(registrationDto, queryRunner);
      this._userService.setAvatar(user.id, imageDto);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error?.code === PostgresErrorCode.UniqueViolation) {
        throw new UserAlreadyExistException();
      }
      console.log(error);
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }

    return user;
  }
}
