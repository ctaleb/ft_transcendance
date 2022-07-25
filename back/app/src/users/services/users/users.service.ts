import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import User from 'src/model/user.entity';
import { CreateUserDto } from 'src/users/dtos/CreateUser.dto';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  getAllUsers() {
    return this.usersRepository.find();
  }

  async getUserById(id: number): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (user) {
      return user;
    }
    throw new HttpException('User not found', HttpStatus.NOT_FOUND);
  }

  async createUser(user: CreateUserDto) {
    const newUser = await this.usersRepository.create(user);
    await this.usersRepository.save(newUser);
    return newUser;
  }
}
