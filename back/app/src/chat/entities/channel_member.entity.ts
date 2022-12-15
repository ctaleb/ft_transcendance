import { ChannelEntity } from 'src/chat/entities/channel.entity';
import { AbstractEntity } from 'src/database/abstract.entity';
import { UserEntity } from 'src/user/user.entity';
import {
  Column,
  Entity,
  JoinColumn, ManyToOne
} from 'typeorm';

export enum ChannelRole {
  OWNER = 'owner',
  ADMIN = 'administrator',
  MEMBER = 'member',
}

@Entity({ name: 'channel_member' })
export class ChannelMemberEntity extends AbstractEntity {
  @ManyToOne((type) => ChannelEntity, (channel) => channel.members, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  public channel: ChannelEntity;

  @ManyToOne((type) => UserEntity, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  public user: UserEntity;

  @Column({ type: 'enum', enum: ChannelRole, default: ChannelRole.MEMBER })
  public role: ChannelRole;
}
