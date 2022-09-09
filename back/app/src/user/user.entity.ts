import { AbstractEntity } from '../database/abstract.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Exclude } from 'class-transformer';
import { ImageEntity } from 'src/image/image.entity';

@Entity({ name: 'user' })
export class UserEntity extends AbstractEntity {
  @Column({ unique: true })
  public nickname: string;

  @Column({ unique: true })
  public phone: string;

  @Column()
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
}
