import { Exclude, Expose, Transform } from 'class-transformer';
import { AbstractEntity } from 'src/database/abstract.entity';
import { UserEntity } from 'src/user/user.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { PrivateConvEntity } from './private_conv.entity';

@Exclude()
@Entity({ name: 'PrivateMessage' })
export class PrivateMessageEntity extends AbstractEntity {
  @ManyToOne(() => PrivateConvEntity, (conv) => conv.messages, { eager: true })
  conv: PrivateConvEntity;

  @Expose()
  @Transform((a) => a.value.nickname)
  @ManyToOne(() => UserEntity, (user) => user.id, { eager: true })
  author: UserEntity;

  @Expose()
  @Column()
  text: string;

  @Expose()
  get date() {
    return this.createdAt;
  }
}
