import { AbstractEntity } from 'src/database/abstract.entity';
import { UserEntity } from 'src/user/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, RelationId } from 'typeorm';

@Entity({ name: 'friendship' })
export class FriendshipEntity extends AbstractEntity {
  @JoinColumn()
  @ManyToOne(() => UserEntity, {
    eager: true,
    onDelete: 'CASCADE',
  })
  public requester: UserEntity;

  @JoinColumn()
  @ManyToOne(() => UserEntity, {
    eager: true,
    onDelete: 'CASCADE',
  })
  public addressee: UserEntity;

  @RelationId('requester')
  public requesterId: number;

  @RelationId('addressee')
  public addresseeId: number;

  @Column()
  public status: string;
}
