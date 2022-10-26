import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'PrivateConvEntity' })
export class PrivateConvEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  firstId: number;

  @Column()
  secondId: number;

  @Column()
  message: string;
}
