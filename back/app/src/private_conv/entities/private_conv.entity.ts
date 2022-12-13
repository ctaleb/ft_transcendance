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
  @ManyToOne(() => UserEntity, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  user1: UserEntity;

  @Expose({
    name: 'other',
    groups: ['user2'],
  })
  @ManyToOne(() => UserEntity, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  user2: UserEntity;

  @OneToMany(() => PrivateMessageEntity, (message) => message.conv, {
    lazy: true,
  })
  @JoinColumn()
  messages: Promise<PrivateMessageEntity[]>;

  @Expose()
  @CreateDateColumn()
  lastMessage: Date;

  @Expose({
    name: 'messages',
  })
  firstsMessages: PrivateMessageEntity[];

  async loadMessages(offset: number = 0, limit: number = 20) {
    this.firstsMessages = await PrivateMessageEntity.find({
      where: {
        conv: { id: this.id },
      },
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });
    return this.firstsMessages;
  }
}
