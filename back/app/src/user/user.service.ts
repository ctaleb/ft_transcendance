import { Injectable, HttpStatus, HttpException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/user/user.entity';
import { CreateUserDto } from 'src/user/user.dto';
import { Repository } from 'typeorm';
import { ImageDto } from 'src/image/image.dto';
import { ImageService } from 'src/image/image.service';
import { unlink } from 'fs';
import { JwtService } from '@nestjs/jwt';
import { FriendshipService } from 'src/friendship/friendship.service';
import { FriendshipEntity } from 'src/friendship/entities/friendship.entity';
import { ServerService } from 'src/server/server.service';

@Injectable()
export class UserService {
  static setAvatar: any;
  constructor(
    @InjectRepository(UserEntity)
    private _usersRepository: Repository<UserEntity>,
    @InjectRepository(FriendshipEntity)
    private _friendshipRepository: Repository<FriendshipEntity>,
    private _imageService: ImageService,
    private _jwtService: JwtService,
  ) {}

  getAllUsers() {
    return this._usersRepository.find();
  }

  async getUserById(id: number): Promise<UserEntity> {
    const user = await UserEntity.findOneBy({ id });
    if (user) {
      return user;
    }
    throw new HttpException('User not found', HttpStatus.NOT_FOUND);
  }

  async getUserByNickname(nickname: string): Promise<UserEntity> {
    const user = await UserEntity.findOneBy({ nickname });
    if (user) {
      return user;
    }
    throw new HttpException('User not found ' + nickname, HttpStatus.NOT_FOUND);
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
  async updatePhone(nickname: string, newPhone: string) {
    const user = await this._usersRepository.findOneBy({ nickname });
    if (user) {
      await this._usersRepository.update(user.id, { phone: newPhone });
      const user_with_password = await this.getUserByNickname(nickname);
      const { password, ...user_without_password } = user_with_password;
      const token = this._jwtService.sign(user_without_password);
      return { user: user_without_password, token: token };
    }
    throw new HttpException('User not Found', HttpStatus.NOT_FOUND);
  }

  async updateAvatar(imageDto: ImageDto, userId: number) {
    const user = await this._usersRepository.findOneBy({ id: userId });
    const oldAvatar = await this._imageService.getImageById(user.avatarId);
    if (oldAvatar.filename != 'pizz.jpeg') {
      unlink(oldAvatar.path, (err) => {
        if (err) throw err;
      });
    }

    await this.setAvatar(user.id, imageDto);
    await this._imageService.deleteImage(user.avatarId);
    const userUpdated = await this._usersRepository.findOneBy({ id: userId });
    const avatar = await this._imageService.getImageById(userUpdated.avatarId);

    const user_with_password = await this.getUserByNickname(userUpdated.nickname);
    const { password, ...user_without_password } = user_with_password;
    const token = this._jwtService.sign(user_without_password);
    return { user: user_without_password, avatar: avatar, token: token };
  }

  async updatePassword(newPassword: string, userId: number) {
    await this._usersRepository.update(userId, { password: newPassword });
    return { success: true };
  }

  async updateElo(newElo: number, userId: number) {
    await this._usersRepository.update(userId, { elo: newElo });
    return { success: true };
  }

  async updateStatus(userId: number, newStatus: string) {
    await this._usersRepository.update(userId, { status: newStatus });
    return { success: true };
  }

  async updateTwoFactorAuth(nickname: string) {
    let twoFactor: boolean;
    const user = await this._usersRepository.findOneBy({ nickname });
    if (user) {
      user.twoFactorAuth == true ? (twoFactor = false) : (twoFactor = true);
      await this._usersRepository.update(user.id, { twoFactorAuth: twoFactor });
      const user_with_password = await this.getUserByNickname(nickname);
      const { password, ...user_without_password } = user_with_password;
      const token = this._jwtService.sign(user_without_password);
      return { user: user_without_password, token: token, newValue: twoFactor };
    }
    throw new HttpException('User not Found', HttpStatus.NOT_FOUND);
  }

  async deleteAccount(user: any) {
    // this._friendshipRepository
    //   .createQueryBuilder()
    //   .delete()
    //   .from(FriendshipEntity)
    //   .where('requesterId = :userId', { userId: user.id })
    //   .orWhere('addresseeId = :userId', { userId: user.id })
    //   .execute();

    this._usersRepository.delete({ id: user.id });
    if (user.avatarId !== 0) this._imageService.deleteImage(user.avatarId);
  }
}
