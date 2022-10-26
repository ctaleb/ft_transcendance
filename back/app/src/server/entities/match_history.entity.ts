import { AbstractEntity } from 'src/database/abstract.entity';
import { UserEntity } from 'src/user/user.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity({ name: 'match_history' })
export class MatchHistoryEntity extends AbstractEntity {
  @JoinColumn({ name: 'hostName', referencedColumnName: 'nickname' })
  @ManyToOne((type) => UserEntity, { eager: true })
  public host: UserEntity;

  @Column()
  public hostScore: number;

  @Column()
  public hostPower: string;

  @Column()
  public hostElo: number;

  @JoinColumn({ name: 'clientName', referencedColumnName: 'nickname' })
  @ManyToOne((type) => UserEntity, { eager: true })
  public client: UserEntity;

  @Column()
  public clientScore: number;

  @Column()
  public clientPower: string;

  @Column()
  public clientElo: number;

  @Column()
  public eloChange: number;

  @Column()
  public gameMode: string;
}