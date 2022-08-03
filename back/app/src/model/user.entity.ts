import { AbstractEntity } from './abstract.entity';
import { Column, Entity } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity({ name: 'user' })
export class UserEntity extends AbstractEntity {
  @Column({ unique: true })
  public nickname: string;

  @Column()
  @Exclude()
  public password: string;
}
