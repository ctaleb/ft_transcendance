import { AbstractEntity } from 'src/database/abstract.entity';
import { UserEntity } from 'src/user/user.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity({ name: 'friendship' })
export class FriendshipEntity extends AbstractEntity {
  @JoinColumn({ name: 'requesterId' })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  public requester: UserEntity;

  @JoinColumn({ name: 'addresseeId' })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  public addressee: UserEntity;

  @Column({ nullable: true })
  public requesterId: number;

  @Column({ nullable: true })
  public addresseeId: number;

  @Column()
  public status: string;
}
