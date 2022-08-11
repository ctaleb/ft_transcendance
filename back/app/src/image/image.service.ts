import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImageEntity } from './image.entity';
import { ImageDto } from './image.dto';

@Injectable()
export class ImageService {
  constructor(
    @InjectRepository(ImageEntity)
    private imageRepository: Repository<ImageEntity>,
  ) {}

  async saveImage(fileData: ImageDto) {
    const newFile = await this.imageRepository.create(fileData);
    await this.imageRepository.save(newFile);
    return newFile;
  }
}
