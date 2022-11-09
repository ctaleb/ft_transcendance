import { AbstractEntity } from '../database/abstract.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Exclude } from 'class-transformer';
import { ImageEntity } from 'src/image/image.entity';
import { ChannelMemberEntity } from 'src/chat/entities/channel_member.entity';

@Entity({ name: 'user' })
export class UserEntity extends AbstractEntity {
  @Column({ unique: true })
  public nickname: string;

  @Column({ unique: false })
  public phone: string;

  @Column({ nullable: true })
  @Exclude()
  public password: string;

  @JoinColumn({ name: 'avatarId' })
  @ManyToOne(() => ImageEntity, {
    nullable: true,
  })
  public avatar?: ImageEntity;

  // We add the avatarId column above so that the entity of the user can hold
  // the id of the avatar without joining all of the data of the avatar.
  @Column({ nullable: true })
  public avatarId?: number;

  @Column({ nullable: true })
  public intraId: string;
}
