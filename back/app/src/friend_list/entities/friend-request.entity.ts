import { AbstractEntity } from 'src/database/abstract.entity';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'friend_request' })
export class FriendRequestEntity extends AbstractEntity {
  @Column()
  public requesterId: number;

  @Column()
  public requesteeId: number;
}
