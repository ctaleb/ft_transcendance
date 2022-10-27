import { AbstractEntity } from 'src/database/abstract.entity';
import { UserEntity } from 'src/user/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { ChannelEntity } from './channel.entity';

@Entity({ name: 'channel_invitation' })
export class ChannelInvitationEntity extends AbstractEntity {
  @OneToMany((type) => ChannelEntity, () => {}, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn()
  public channel: ChannelEntity;

  @OneToMany((type) => UserEntity, () => {}, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  public target: UserEntity;
}
