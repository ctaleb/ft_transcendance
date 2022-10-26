import { AbstractEntity } from 'src/database/abstract.entity';
import { UserEntity } from 'src/user/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToOne,
} from 'typeorm';

export enum ChannelType {
  PUBLIC = 'public',
  PRIVATE = 'private',
  PROTECTED = 'protected',
}

@Entity({ name: 'channel' })
export class ChannelEntity extends AbstractEntity {
  @Column({ unique: true })
  public name: string;

  @Column({ type: 'enum', enum: ChannelType, default: ChannelType.PUBLIC })
  public type: ChannelType;

  @Column({ nullable: true })
  public password: string;

  @OneToOne((type) => UserEntity, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ referencedColumnName: 'nickname' })
  public owner: UserEntity;

  @ManyToMany(() => UserEntity)
  @JoinTable()
  public mutedUsers: UserEntity[];

  @ManyToMany(() => UserEntity)
  @JoinTable()
  public bannedUsers: UserEntity[];
}
