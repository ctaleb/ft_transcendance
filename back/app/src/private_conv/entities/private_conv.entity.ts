import { AbstractEntity } from 'src/database/abstract.entity';
import { UserEntity } from 'src/user/user.entity';
import { CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { PrivateMessageEntity } from './privateMessage.entity';

@Entity({ name: 'PrivateConvEntity' })
export class PrivateConvEntity extends AbstractEntity {
  @ManyToOne(() => UserEntity, { eager: true })
  @JoinColumn()
  user1: UserEntity;

  @ManyToOne(() => UserEntity, { eager: true })
  @JoinColumn()
  user2: UserEntity;

  @OneToMany(() => PrivateMessageEntity, (message) => message.conv)
  @JoinColumn()
  messages: PrivateMessageEntity[];

  @CreateDateColumn()
  lastMessage: Date;
}
