import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  users = [
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

  createUser() {
    return 'Thanks';
  }
}
