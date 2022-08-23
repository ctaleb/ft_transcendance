import { AbstractEntity } from '../database/abstract.entity';
import { Column, Entity } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity({ name: 'image' })
export class ImageEntity extends AbstractEntity {
  @Column()
  public filename: string;

  @Column()
  public path: string;

  @Column()
  public mimetype: string;
}
