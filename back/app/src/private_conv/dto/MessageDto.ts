import { UserEntity } from 'src/user/user.entity';
import { PrivateConvEntity } from '../entities/private_conv.entity';

export class MessageDto {
  conv: PrivateConvEntity;
  author: UserEntity;
  text: string;
}
