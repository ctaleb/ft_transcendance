import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/user/user.entity';
import { CreateUserDto } from 'src/user/user.dto';
import { Repository, QueryRunner } from 'typeorm';
import { ImageDto } from 'src/image/image.dto';
import { ImageService } from 'src/image/image.service';
import { unlink } from 'fs';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  static setAvatar: any;
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
      const avatar = await this._imageService.getImageById(user.avatarId);
      return { ...user, ...avatar };
    }
    throw new HttpException('User not found', HttpStatus.NOT_FOUND);
  }
  
  async getUserByNickname(nickname: string): Promise<UserEntity> {
    const user = await this._usersRepository.findOneBy({ nickname });
    if (user) {
      const avatar = await this._imageService.getImageById(user.avatarId);
      return { ...user, avatar };
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
    let avatar;
    if (fileData) {
      avatar = await this._imageService.saveImage(fileData);
    } else {
      avatar = await this._imageService.getDefaultAvatar();
    }
    await this._usersRepository.update(userId, {
      avatarId: avatar.id, // a revoir
    });
    return await this._usersRepository.findOneBy({ id: userId });
  }

  async getIntraUserById(intraId: string) {
    const user = await this._usersRepository.findOneBy({ intraId });
    if (user) {
      const avatar = await this._imageService.getImageById(user.avatarId);
      return { ...user, avatar };
    }
    throw new HttpException('User not found', HttpStatus.NOT_FOUND);
  }

  //PROFILE EDITION
  async updateNickname(oldNickname: string, newNickname: string) {
    console.log("old nickname: " + oldNickname);
    console.log("new nickname: " + newNickname);
    let nickname = oldNickname;
    let user = await this._usersRepository.findOneBy({nickname});
    if (user) {
        const avatar = this._imageService.getImageById(user.avatarId);
        await this._usersRepository.update(user.id, {nickname:newNickname});
        const ret_user = await this._usersRepository.findOneBy({id: user.id});
        return {...ret_user, avatar};
    }
    throw new HttpException('User not Found', HttpStatus.NOT_FOUND);
  }

  async updateAvatar(imageDto: ImageDto, userId: number){
    const user = await this._usersRepository.findOneBy({id: userId});
    const oldAvatar = await this._imageService.getImageById(user.avatarId);
    unlink(oldAvatar.path, (err) => {
      if (err) throw err;
      console.log(oldAvatar.path + ' has been deleted');
    });
    
    await this.setAvatar(user.id, imageDto);
    await this._imageService.deleteImage(user.avatarId);
    const userUpdated = await this._usersRepository.findOneBy({id: userId})
    const avatar = await this._imageService.getImageById(userUpdated.avatarId);
    return {...userUpdated, avatar};
  }

  async updatePassword(newPassword: string, userId: number){
    const user = await this._usersRepository.findOneBy({id: userId});
    //newPassword = await bcrypt.hash(newPassword, 10);
    await this._usersRepository.update(userId, {password: newPassword})
    console.log("newPassword: " + newPassword)
    return {success: true};
  }
}
