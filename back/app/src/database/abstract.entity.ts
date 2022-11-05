import { Exclude } from 'class-transformer';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Generated,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class AbstractEntity extends BaseEntity {
  @Exclude()
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  @Generated('uuid')
  public uuid: string;

  @Exclude()
  @CreateDateColumn()
  public createdAt: Date;

  @Exclude()
  @UpdateDateColumn()
  public updatedAt: Date;
}
