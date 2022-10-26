import { AbstractEntity } from 'src/database/abstract.entity';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToOne,
} from 'typeorm';

@Entity({ name: 'channel_message' })
export class ChannelMessageEntity extends AbstractEntity {}
