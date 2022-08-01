import { Injectable, HttpStatus, HttpException, Res } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import User from 'src/model/user.entity';
import { CreateUserDto } from 'src/users/dtos/CreateUser.dto';
import { LoginUserDto } from 'src/users/dtos/LoginUser.dto';
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

  async loginUser(loginuser: LoginUserDto) {
    const userToConnect = await this.usersRepository.findOneBy({ firstName: loginuser.firstName });
    if (userToConnect && userToConnect.lastName == loginuser.lastName)
      return {message: 'Logged'}
    else
      return {message: 'Not Logged'}
  }
}
