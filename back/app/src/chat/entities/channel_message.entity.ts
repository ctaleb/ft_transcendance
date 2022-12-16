import { AbstractEntity } from 'src/database/abstract.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ChannelEntity } from './channel.entity';
import { ChannelMemberEntity } from './channel_member.entity';

@Entity({ name: 'channel_message' })
export class ChannelMessageEntity extends AbstractEntity {
  @ManyToOne((type) => ChannelEntity, (channel) => channel.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  public channel: ChannelEntity;

  @ManyToOne((type) => ChannelMemberEntity, {
    onDelete: 'SET NULL',
  })
  @JoinColumn()
  public sender: ChannelMemberEntity;

  @Column()
  public content: string;
}
