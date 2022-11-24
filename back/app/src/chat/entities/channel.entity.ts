import { Exclude, Expose } from 'class-transformer';
import { AbstractEntity } from 'src/database/abstract.entity';
import { UserEntity } from 'src/user/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { ChannelMemberEntity } from './channel_member.entity';
import { ChannelMessageEntity } from './channel_message.entity';
import { ChannelRestrictionsEntity } from './channel_restrictions.entity';

export enum ChannelType {
  PUBLIC = 'public',
  PRIVATE = 'private',
  PROTECTED = 'protected',
}

@Exclude()
@Entity({ name: 'channel' })
export class ChannelEntity extends AbstractEntity {
  @Expose()
  @Column({ unique: true })
  public name: string;
  
  @Expose()
  @Column({ type: 'enum', enum: ChannelType, default: ChannelType.PUBLIC })
  public type: ChannelType;
  
  @Column({ nullable: true })
  @Exclude()
  public password: string;
  
  @OneToMany(() => ChannelMemberEntity, (members) => members.channel, {
    cascade: ['insert', 'update', 'remove'],
  })
  @JoinColumn()
  public members: ChannelMemberEntity[];
  
  @OneToMany(() => ChannelMessageEntity, (message) => message.channel, {
    cascade: ['insert', 'update', 'remove'],
  })
  @JoinColumn()
  public messages: ChannelMessageEntity[];
  
  @OneToMany(() => ChannelRestrictionsEntity, (members) => members.channel, {
    cascade: ['insert', 'update', 'remove'],
  })
  @JoinColumn()
  public restrictedMembers: ChannelRestrictionsEntity[];
}
