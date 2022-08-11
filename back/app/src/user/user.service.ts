import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/user/user.entity';
import { CreateUserDto } from 'src/user/user.dto';
import { Repository, QueryRunner } from 'typeorm';
import { ImageDto } from 'src/image/image.dto';
import { ImageService } from 'src/image/image.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private _usersRepository: Repository<UserEntity>,
    private _imageService: ImageService,
  ) {}

  getAllUsers() {
    return this._usersRepository.find();
  }

  async getUserById(id: number): Promise<UserEntity> {
    const user = await this._usersRepository.findOneBy({ id });
    if (user) {
      return user;
    }
    throw new HttpException('User not found', HttpStatus.NOT_FOUND);
  }

  async createUser(
    createUserDto: CreateUserDto,
    queryRunner: QueryRunner,
  ): Promise<UserEntity> {
    const user = this._usersRepository.create(createUserDto);
    return this._usersRepository.save(user);
  }

  async setAvatar(userId: number, fileData: ImageDto) {
    const avatar = await this._imageService.saveImage(fileData);
    await this._usersRepository.update(userId, {
      avatarId: avatar.id,
    });
  }
}
