import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/model/user.entity';
import { CreateUserDto } from 'src/dtos/user.dto';
import { Repository, QueryRunner } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
  ) {}

  getAllUsers() {
    return this.usersRepository.find();
  }

  async getUserById(id: number): Promise<UserEntity> {
    const user = await this.usersRepository.findOneBy({ id });
    if (user) {
      return user;
    }
    throw new HttpException('User not found', HttpStatus.NOT_FOUND);
  }

  async createUser(
    createUserDto: CreateUserDto,
    queryRunner: QueryRunner,
  ): Promise<UserEntity> {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }
}
