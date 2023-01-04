import { AbstractEntity } from 'src/database/abstract.entity';
import { UserEntity } from 'src/user/user.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity({ name: 'friendship' })
export class FriendshipEntity extends AbstractEntity {
  @JoinColumn()
  @ManyToOne(() => UserEntity, {
    eager: true,
    onDelete: 'CASCADE',
  })
  public requester: UserEntity;

  @JoinColumn()
  @ManyToOne(() => UserEntity, {
    eager: true,
    onDelete: 'CASCADE',
  })
  public addressee: UserEntity;

  @Column({ nullable: true })
  public requesterId: number;

  @Column({ nullable: true })
  public addresseeId: number;

  @Column()
  public status: string;
}
