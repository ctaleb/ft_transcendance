import { Injectable } from '@nestjs/common';
import { CreateUserDto } from 'src/users/dtos/CreateUser.dto';
import { User } from 'src/users/types/User';

@Injectable()
export class UsersService {
  private users: User[] = [
    {
      id: 1,
      firstName: 'John',
      lastName: 'Smith',
    },
    {
      id: 2,
      firstName: 'Adam',
      lastName: 'Smith',
    },
    {
      id: 3,
      firstName: 'Mike',
      lastName: 'Miller',
    },
  ];

  findUserById(id: number) {
    return this.users.find((user) => user.id === id);
  }

  getUsers() {
    return this.users;
  }

  createUser(userDto: CreateUserDto) {
    let user: User = {
      id: this.users.length + 1,
      firstName: userDto.firstName,
      lastName: userDto.lastName,
    };
    this.users.push(user);
  }
}
