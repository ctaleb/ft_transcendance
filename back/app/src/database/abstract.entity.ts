import { Exclude, Expose } from 'class-transformer';
import { BaseEntity, Column, CreateDateColumn, Generated, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Exclude()
export abstract class AbstractEntity extends BaseEntity {
  @Expose()
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  @Generated('uuid')
  public uuid: string;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}
