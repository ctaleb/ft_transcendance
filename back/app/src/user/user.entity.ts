import { Exclude, Expose, Transform } from 'class-transformer';
import { FriendshipEntity } from 'src/friendship/entities/friendship.entity';
import { ImageEntity } from 'src/image/image.entity';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
} from 'typeorm';
import { AbstractEntity } from '../database/abstract.entity';

@Exclude()
@Entity({ name: 'user' })
export class UserEntity extends AbstractEntity {
  @Expose()
  @Column({ unique: true })
  public nickname: string;

  @Column({ unique: false })
  public phone: string;

  @Column({ nullable: true })
  public password: string;

  @JoinColumn({ name: 'avatarId' })
  @ManyToOne(() => ImageEntity, {
    eager: true,
    nullable: true,
  })
  public avatar?: ImageEntity;

  // @Expose()
  // @ManyToMany(() => UserEntity, {
  //   eager: true,
  // })
  // @JoinTable({
  //   name: 'friendship',
  //   joinColumn: {
  //     name: 'requesterId',
  //   },
  //   inverseJoinColumn: {
  //     name: 'addresseeId',
  //   },
  // })
  // public friendship?: UserEntity[];

  @Expose({ name: 'friends' })
  async getFriends(): Promise<UserEntity[]> {
    const friends = await FriendshipEntity.find({
      where: [
        {
          addresseeId: this.id,
          status: 'friend',
        },
        {
          requesterId: this.id,
          status: 'friend',
        },
      ],
    }).then(async (data) => {
      const result: UserEntity[] = [];
      for (const entity of data) {
        if (entity.requesterId === this.id)
          result.push(await UserEntity.findOneBy({ id: entity.addresseeId }));
        else
          result.push(await UserEntity.findOneBy({ id: entity.requesterId }));
      }
      return result;
    });
    return friends;
  }

  @Expose({ name: 'avatar' })
  getAvatarUrl(): string {
    return this.avatar ? '/api/user/profile-picture/' + this.avatar.path : '';
  }

  // We add the avatarId column above so that the entity of the user can hold
  // the id of the avatar without joining all of the data of the avatar.
  @Column({ nullable: true })
  public avatarId?: number;

  @Column({ nullable: true })
  public intraId: string;
}
