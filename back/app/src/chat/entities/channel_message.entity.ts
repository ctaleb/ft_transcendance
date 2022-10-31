import { AbstractEntity } from 'src/database/abstract.entity';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { ChannelMemberEntity } from './channel_member.entity';

@Entity({ name: 'channel_message' })
export class ChannelMessageEntity extends AbstractEntity {
  @ManyToOne(() => ChannelMemberEntity, { eager: true, onDelete: 'SET NULL' })
  @JoinColumn()
  public sender: ChannelMemberEntity;

  @Column()
  public content: string;
}
