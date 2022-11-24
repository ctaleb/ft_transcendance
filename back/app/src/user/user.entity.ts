import { Exclude, Expose, Transform } from 'class-transformer';
import { FriendshipEntity } from 'src/friendship/entities/friendship.entity';
import { ImageEntity } from 'src/image/image.entity';
import {
  BeforeInsert,
  Column,
  Entity,
  Generated,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { AbstractEntity } from '../database/abstract.entity';

@Exclude()
@Entity({ name: 'user' })
export class UserEntity extends AbstractEntity {
  @Expose()
  @Column({ unique: true })
  public nickname: string;

  @Column({ unique: false, nullable: true })
  public phone: string;

  @Column({ type: 'boolean', default: false })
  public twoFactorAuth: boolean;

  @Column({ nullable: true })
  public password: string;

  @JoinColumn({ name: 'avatarId' })
  @ManyToOne(() => ImageEntity, {
    eager: true,
    nullable: true,
  })
  public avatar?: ImageEntity;

  @Expose({ name: 'friends' })
  public friends?: UserEntity[];

  async getFriends(): Promise<UserEntity[]> {
    const friends = await FriendshipEntity.find({
      where: [
        {
          addressee: { id: this.id },
          status: 'friend',
        },
        {
          requester: { id: this.id },
          status: 'friend',
        },
      ],
    }).then(async (data) => {
      const result: UserEntity[] = [];
      for (const entity of data) {
        if (entity.requesterId === this.id) result.push(entity.addressee);
        else result.push(entity.requester);
      }
      return result;
    });
    return friends;
  }

  async getInvitations(): Promise<UserEntity[]> {
    const invitations = await FriendshipEntity.find({
      where: [
        {
          addressee: { id: this.id },
          status: 'invitation',
        },
      ],
    }).then(async (data) => {
      const result: UserEntity[] = [];
      for (const entity of data) {
        result.push(entity.requester);
      }
      return result;
    });
    return invitations;
  }

  @Expose({ name: 'avatar' })
  getAvatarUrl(): string {
    return this.avatar ? '/api/user/profile-picture/' + this.avatar.path : '';
  }

  @Expose({ name: 'elo' })
  @Column({ default: 1000 })
  public elo: number;

  // We add the avatarId column above so that the entity of the user can hold
  // the id of the avatar without joining all of the data of the avatar.
  @Column({ nullable: true })
  public avatarId?: number;

  @Column({ nullable: true })
  public intraId: string;
}
