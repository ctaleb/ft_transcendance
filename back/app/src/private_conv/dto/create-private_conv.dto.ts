import { UserEntity } from 'src/user/user.entity';

export class CreatePrivateConvDto {
  readonly user1: UserEntity;
  readonly user2: UserEntity;
}
