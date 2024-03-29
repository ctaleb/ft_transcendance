import { AbstractEntity } from 'src/database/abstract.entity';
import { UserEntity } from 'src/user/user.entity';
import { Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ChannelEntity } from './channel.entity';

@Entity({ name: 'channel_invitation' })
export class ChannelInvitationEntity extends AbstractEntity {
  @ManyToOne((type) => ChannelEntity, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  public channel: ChannelEntity;

  @ManyToOne((type) => UserEntity, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  public target: UserEntity;
}
