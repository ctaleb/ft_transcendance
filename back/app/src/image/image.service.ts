import { Injectable, NotFoundException } from '@nestjs/common';
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

  async getDefaultAvatar() {
    return this.getImageById(1);
  }

  async getImageById(id: number) {
    const file = await this.imageRepository.findOneBy({ id });
    if (file) {
      return file;
    }
    throw new NotFoundException();
  }
}
