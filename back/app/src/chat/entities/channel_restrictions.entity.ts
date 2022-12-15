import { AbstractEntity } from 'src/database/abstract.entity';
import { UserEntity } from 'src/user/user.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ChannelEntity } from './channel.entity';

@Entity({ name: 'channel_restrictions' })
export class ChannelRestrictionsEntity extends AbstractEntity {
  @ManyToOne((type) => ChannelEntity, (channel) => channel.restrictedMembers, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  public channel: ChannelEntity;

  @ManyToOne((type) => UserEntity, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  public user: UserEntity;

  @Column({ nullable: true, default: null })
  public mute?: Date;

  @Column({ nullable: true, default: null })
  public ban?: Date;
}
