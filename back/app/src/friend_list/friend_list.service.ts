import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';
import { DataSource, DeleteResult, Repository } from 'typeorm';
import { CreateFriendListDto } from './dto/create-friend_list.dto';
import { DeleteFriendListDto } from './dto/delete-friend_list.dto';
import { FriendRequestDto } from './dto/friend-request.dto';
import { FriendRequestEntity } from './entities/friend-request.entity';
import { FriendListEntity } from './entities/friend_list.entity';

@Injectable()
export class FriendListService {
  constructor(
    @InjectRepository(FriendListEntity)
    private _friendListRepository: Repository<FriendListEntity>,
    @InjectRepository(FriendRequestEntity)
    private _friendRequestRepository,
    private _userService: UserService,
    private _dataSource: DataSource,
  ) {}

  async createFriendRequest(
    friendRequestDto: FriendRequestDto,
  ): Promise<FriendRequestEntity> {
    const queryRunner = this._dataSource.createQueryRunner();
    let friend: FriendRequestEntity;
    let returnValue: Promise<FriendRequestEntity>;

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const requestee = await this._userService.getUserByNickname(
        friendRequestDto.requesteeName,
      );
      const friendsR = await this.findAllRequests(friendRequestDto.requesterId);
      friend = friendsR.find(
        (element) =>
          element.requesteeId === requestee.id ||
          element.requesterId === requestee.id,
      );
      if (friend)
        throw new NotAcceptableException('Friendship request already created');
      const friendsL = await this.findAll(friendRequestDto.requesterId);
      friend = friendsL.find(
        (element) =>
          element.requesteeId === requestee.id ||
          element.requesterId === requestee.id,
      );
      if (friend) throw new NotAcceptableException('Friendship already exist');
      friend = this._friendRequestRepository.create({
        requesterId: friendRequestDto.requesterId,
        requesteeId: requestee.id,
      });
      returnValue = this._friendListRepository.save(friend);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.log(error);
    } finally {
      await queryRunner.release();
    }
    return returnValue;
  }

  async deleteFriendRequest(
    deleteFriendRequestDto: DeleteFriendListDto,
  ): Promise<DeleteResult> {
    let returnValue: Promise<DeleteResult>;
    const queryRunner = this._dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      returnValue = this._friendRequestRepository
        .createQueryBuilder()
        .delete()
        .from(FriendRequestEntity)
        .where('requesterId = :id1 and requesteeId = :id2', {
          id1: deleteFriendRequestDto.requesterId,
          id2: deleteFriendRequestDto.requesteeId,
        })
        .orWhere('requesterId = :id2 and requesteeId = :id1', {
          id1: deleteFriendRequestDto.requesterId,
          id2: deleteFriendRequestDto.requesteeId,
        })
        .execute();
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.log(error);
    } finally {
      await queryRunner.release();
    }
    return returnValue;
  }

  async create(
    createFriendListDto: CreateFriendListDto,
  ): Promise<FriendListEntity> {
    let friend: FriendListEntity;
    let returnValue: Promise<FriendListEntity>;
    const queryRunner = this._dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const friends = await this.findAll(createFriendListDto.requesterId);
      friend = friends.find(
        (element) =>
          element.requesteeId === createFriendListDto.requesteeId ||
          element.requesterId === createFriendListDto.requesteeId,
      );
      if (friend)
        throw new NotAcceptableException('This friendship already exists');
      friend = this._friendListRepository.create(createFriendListDto);
      returnValue = this._friendListRepository.save(friend);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.log(error);
    } finally {
      await queryRunner.release();
    }
    return returnValue;
  }

  async getFriendList(id: number) {
    const friends = await this.findAll(id);
    const invitationsIn = this._friendRequestRepository.find({
      requesteeId: id,
    });
    const invitationsOut = this._friendRequestRepository.find({
      requesterId: id,
    });
    const requesteeArr = friends.filter(
      (element) => element.requesteeId === id,
    );
    const requesterArr = friends.filter(
      (element) => element.requesterId === id,
    );
    const resultArray = [];
    requesteeArr.forEach((element) => {
      resultArray.push(element.requesterId);
    });
    requesterArr.forEach((element) => {
      resultArray.push(element.requesteeId);
    });
    return {
      friends: this._userService.getUsersByIds(resultArray),
      invitationsIn: this._userService.getUsersByIds(invitationsIn),
      invitationsOut: this._userService.getUsersByIds(invitationsOut),
    };
  }

  async findAll(id: number): Promise<FriendListEntity[]> {
    let requesteeList: FriendListEntity[];
    let requesterList: FriendListEntity[];
    requesteeList = await this._friendListRepository.find({
      select: { requesteeId: true, requesterId: false },
      where: { requesterId: id },
    });
    requesterList = await this._friendListRepository.find({
      select: { requesterId: true },
      where: { requesteeId: id },
    });
    return [...requesteeList.values(), ...requesterList.values()];
  }

  async findAllRequests(id: number): Promise<FriendRequestEntity[]> {
    let requesteeList: FriendRequestEntity[];
    let requesterList: FriendRequestEntity[];
    requesteeList = await this._friendRequestRepository.find({
      select: { requesteeId: true, requesterId: false },
      where: { requesterId: id },
    });
    requesterList = await this._friendRequestRepository.find({
      select: { requesterId: true },
      where: { requesteeId: id },
    });
    return [...requesteeList.values(), ...requesterList.values()];
  }

  async delete(
    deleteFriendListDto: DeleteFriendListDto,
  ): Promise<DeleteResult> {
    let returnValue: Promise<DeleteResult>;
    const queryRunner = this._dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      returnValue = this._friendListRepository
        .createQueryBuilder()
        .delete()
        .from(FriendListEntity)
        .where('requesterId = :id1 and requesteeId = :id2', {
          id1: deleteFriendListDto.requesterId,
          id2: deleteFriendListDto.requesteeId,
        })
        .orWhere('requesterId = :id2 and requesteeId = :id1', {
          id1: deleteFriendListDto.requesterId,
          id2: deleteFriendListDto.requesteeId,
        })
        .execute();
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.log(error);
    } finally {
      await queryRunner.release();
    }
    return returnValue;
  }
}
