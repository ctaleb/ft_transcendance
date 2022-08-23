import { AbstractEntity } from 'src/database/abstract.entity';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'friend_list' })
export class FriendListEntity extends AbstractEntity {
  @Column()
  public requesterId: number;

  @Column()
  public requesteeId: number;
}
