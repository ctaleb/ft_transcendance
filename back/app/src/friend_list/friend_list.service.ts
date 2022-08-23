import {
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, DeleteResult, Repository } from 'typeorm';
import { CreateFriendListDto } from './dto/create-friend_list.dto';
import { DeleteFriendListDto } from './dto/delete-friend_list.dto';
import { FriendListEntity } from './entities/friend_list.entity';

@Injectable()
export class FriendListService {
  constructor(
    @InjectRepository(FriendListEntity)
    private _friendListRepository: Repository<FriendListEntity>,
    private _dataSource: DataSource,
  ) {}

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
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
    return returnValue;
  }
}
