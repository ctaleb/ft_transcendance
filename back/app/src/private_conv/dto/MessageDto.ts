import { UserEntity } from 'src/user/user.entity';

export class MessageDto {
  author: UserEntity;
  text: string;
}
