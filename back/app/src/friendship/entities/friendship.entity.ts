import { AbstractEntity } from 'src/database/abstract.entity';
import { UserEntity } from 'src/user/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';

@Entity({ name: 'friendship' })
export class FriendshipEntity extends AbstractEntity {
  @ManyToOne((type) => UserEntity)
  @JoinColumn({ name: 'requesterId' })
  public requester: UserEntity;

  @ManyToOne((type) => UserEntity)
  @JoinColumn({ name: 'addresseeId' })
  public addressee: UserEntity;

  @Column({ nullable: true })
  public requesterId: number;

  @Column({ nullable: true })
  public addresseeId: number;

  @Column()
  public status: string;
}
