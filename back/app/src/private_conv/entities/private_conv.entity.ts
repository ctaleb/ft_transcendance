import { Exclude, Expose } from 'class-transformer';
import { AbstractEntity } from 'src/database/abstract.entity';
import { UserEntity } from 'src/user/user.entity';
import { CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { PrivateMessageEntity } from './privateMessage.entity';

@Exclude()
@Entity({ name: 'PrivateConvEntity' })
export class PrivateConvEntity extends AbstractEntity {
  @Expose({
    name: 'other',
  })
  @ManyToOne(() => UserEntity, { eager: true })
  @JoinColumn()
  user1: UserEntity;

  @Expose({
    name: 'other',
    groups: ['user2'],
  })
  @ManyToOne(() => UserEntity, { eager: true })
  @JoinColumn()
  user2: UserEntity;

  @Expose()
  @OneToMany(() => PrivateMessageEntity, (message) => message.conv, {
    lazy: true,
  })
  @JoinColumn()
  messages: Promise<PrivateMessageEntity[]>;

  @Expose()
  @CreateDateColumn()
  lastMessage: Date;
}
