import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PostgresErrorCode } from 'src/database/errors.constraint';
import { UserService } from 'src/user/user.service';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { CreateUserDto } from 'src/user/user.dto';
import { RegistrationDto } from 'src/authentication/registration.dto';
import { UserEntity } from 'src/user/user.entity';
import { UserAlreadyExistException } from 'src/authentication/authentication.exception';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AuthenticationService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly _authenticationRepository: Repository<UserEntity>,
    private readonly _userService: UserService,
    private readonly _dataSource: DataSource,
  ) {}

  async registration(registrationDto: RegistrationDto): Promise<UserEntity> {
    let user: UserEntity;
    const queryRunner = this._dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      user = await this._userService.createUser(registrationDto, queryRunner);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error?.code === PostgresErrorCode.UniqueViolation) {
        throw new UserAlreadyExistException();
      }

      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }

    return user;
  }
}
