import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PostgresErrorCode } from 'src/database/errors.constraint';
import { UserService } from 'src/user/user.service';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { CreateUserDto } from 'src/user/user.dto';
import { RegistrationDto } from 'src/authentication/registration.dto';
import { UserEntity } from 'src/user/user.entity';
import { UserAlreadyExistException } from 'src/authentication/user-already-exist.exception';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';


@Injectable()
export class AuthenticationService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly _authenticationRepository: Repository<UserEntity>,
    private readonly _userService: UserService,
    private readonly _dataSource: DataSource,
    private jwtService: JwtService,
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

  async validateUser(username: string, plainPassword: string): Promise<any> {
    console.log("First output");
   const user = await this._userService.getUserByNickname(username);
    console.log(user);
    if (user) {
        if (bcrypt.compareSync(plainPassword, user.password))
        {
            console.log("lalala");
            const { password, ...ret } = user;
            return ret;
        }
    }
    console.log("nul");
    return null;
  }

  async login(user: any) {
    const payload = { username: user.nickname, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
