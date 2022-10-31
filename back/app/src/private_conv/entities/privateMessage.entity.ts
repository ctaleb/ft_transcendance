import { AbstractEntity } from 'src/database/abstract.entity';
import { UserEntity } from 'src/user/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PrivateConvEntity } from './private_conv.entity';

@Entity({ name: 'PrivateMessage' })
export class PrivateMessageEntity extends AbstractEntity {
  @ManyToOne(() => PrivateConvEntity, (conv) => conv.messages, { eager: true })
  conv: PrivateConvEntity;

  @ManyToOne(() => UserEntity, (user) => user.id, { eager: true })
  author: UserEntity;

  @Column()
  text: string;
}
