import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/user/user.entity';
import { CreateUserDto } from 'src/user/user.dto';
import { Repository, QueryRunner } from 'typeorm';
import { ImageDto } from 'src/image/image.dto';
import { ImageService } from 'src/image/image.service';
import { unlink } from 'fs';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from 'src/authentication/constants';

@Injectable()
export class UserService {
  static setAvatar: any;
  constructor(
    @InjectRepository(UserEntity)
    private _usersRepository: Repository<UserEntity>,
    private _imageService: ImageService,
    private _jwtService: JwtService,
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

  async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
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
      avatarId: avatar.id,
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
    const nickname = oldNickname;
    const user = await this._usersRepository.findOneBy({ nickname });
    if (user) {
      const userExists = await this._usersRepository.findOneBy({
        nickname: newNickname,
      });
      if (userExists) {
        throw new HttpException('User not Found', HttpStatus.NOT_FOUND);
      }
      await this._usersRepository.update(user.id, { nickname: newNickname });
      const user_with_password = await this.getUserByNickname(newNickname);
      const { password, ...user_without_password } = user_with_password;
      const token = this._jwtService.sign(user_without_password);
      return { user: user_without_password, token: token };
    }
    throw new HttpException('User not Found', HttpStatus.NOT_FOUND);
  }

  async updateAvatar(imageDto: ImageDto, userId: number) {
    const user = await this._usersRepository.findOneBy({ id: userId });
    const oldAvatar = await this._imageService.getImageById(user.avatarId);
    unlink(oldAvatar.path, (err) => {
      if (err) throw err;
      console.log(oldAvatar.path + ' has been deleted');
    });

    await this.setAvatar(user.id, imageDto);
    await this._imageService.deleteImage(user.avatarId);
    const userUpdated = await this._usersRepository.findOneBy({ id: userId });
    const avatar = await this._imageService.getImageById(userUpdated.avatarId);

    const user_with_password = await this.getUserByNickname(
      userUpdated.nickname,
    );
    const { password, ...user_without_password } = user_with_password;
    const token = this._jwtService.sign(user_without_password);
    return { user: user_without_password, avatar: avatar, token: token };
  }

  async updatePassword(newPassword: string, userId: number) {
    await this._usersRepository.update(userId, { password: newPassword });
    return { success: true };
  }

  async deleteAccount(user: any) {
    this._usersRepository.delete({ id: user.id });
    this._imageService.deleteImage(user.avatarId);
  }
}
