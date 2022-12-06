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

  @CreateDateColumn({ type: 'timestamptz' })
  public createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  public updatedAt: Date;
}
