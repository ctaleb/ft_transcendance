import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { FriendshipEntity } from './entities/friendship.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from 'src/user/user.service';
import { UserEntity } from 'src/user/user.entity';
import {
  BlockedFriendshipException,
  CannotAcceptFriendshipRequestException,
  FriendshipAlreadyExistsException,
} from './friendship.exception';
import { ServerService } from 'src/server/server.service';

@Injectable()
export class FriendshipService {
  @Inject(ServerService)
  private readonly _serverService: ServerService;
  constructor(
    @InjectRepository(FriendshipEntity)
    private _friendshipRepository: Repository<FriendshipEntity>,
    private _userService: UserService,
  ) {}

  async invite(
    requester: string,
    addressee: string,
  ): Promise<FriendshipEntity> {
    let result: Promise<FriendshipEntity>;

    try {
      const req: UserEntity = await this._userService.getUserByNickname(
        requester,
      );
      const adr: UserEntity = await this._userService.getUserByNickname(
        addressee,
      );
      if (adr.id === req.id)
        throw new BadRequestException(
          'Requester and addressee are the same person',
        );
      const friendship = await this.findFriendship(req, adr);
      if (friendship) {
        if (friendship.status !== 'blocked')
          throw new FriendshipAlreadyExistsException();
        else if (friendship.requesterId === req.id)
          this._friendshipRepository.remove(friendship);
        else throw new BlockedFriendshipException();
      }
      const invitation: FriendshipEntity = this._friendshipRepository.create({
        requester: req,
        addressee: adr,
        status: 'invitation',
      });
      result = this._friendshipRepository.save(invitation);
      const invited = this._serverService.playerList.find(
        (element) => element.name === addressee,
      );
      invited?.socket.emit('friendshipInvite', requester);
    } catch (error) {
      console.log(error);
    }
    return result;
  }

  async findFriendship(requester: UserEntity, addressee: UserEntity) {
    let friendship: FriendshipEntity;
    friendship = await this._friendshipRepository.findOneBy({
      requesterId: requester.id,
      addresseeId: addressee.id,
    });
    if (friendship === null) {
      friendship = await this._friendshipRepository.findOneBy({
        requesterId: addressee.id,
        addresseeId: requester.id,
      });
    }
    return friendship;
  }

  async findInvitationsOf(user: UserEntity) {
    const invitations = await this._friendshipRepository
      .findBy({
        addresseeId: user.id,
        status: 'invitation',
      })
      .then(async (data) => {
        const invits: UserEntity[] = [];
        for (const entity of data) {
          const invite = await this._userService.getUserById(
            entity.requesterId,
          );
          invits.push(invite);
        }
        return invits;
      });
    return invitations;
  }

  async findFriendsOf(user: UserEntity) {
    const friends = await this._friendshipRepository
      .findBy([
        {
          addresseeId: user.id,
          status: 'friend',
        },
        {
          requesterId: user.id,
          status: 'friend',
        },
      ])
      .then(async (data) => {
        const result: UserEntity[] = [];
        for (const entity of data) {
          if (entity.requesterId === user.id)
            result.push(
              await this._userService.getUserById(entity.addresseeId),
            );
          else
            result.push(
              await this._userService.getUserById(entity.requesterId),
            );
        }
        return result;
      });
    return friends;
  }

  async befriend(
    requester: string,
    addressee: string,
  ): Promise<FriendshipEntity> {
    let result: Promise<FriendshipEntity>;

    try {
      const req: UserEntity = await this._userService.getUserByNickname(
        requester,
      );
      const adr: UserEntity = await this._userService.getUserByNickname(
        addressee,
      );
      if (adr.id === req.id)
        throw new BadRequestException(
          'Requester and addressee are the same person',
        );
      const friendship = await this.findFriendship(req, adr);
      if (
        friendship &&
        friendship.status === 'invitation' &&
        friendship.requesterId === adr.id
      ) {
        friendship.status = 'friend';
        result = this._friendshipRepository.save(friendship);
      } else throw new CannotAcceptFriendshipRequestException();
    } catch (error) {
      console.log(error);
    }
    return result;
  }

  async declineFriendship(
    requester: string,
    addressee: string,
  ): Promise<FriendshipEntity> {
    let result: Promise<FriendshipEntity>;

    try {
      const req: UserEntity = await this._userService.getUserByNickname(
        requester,
      );
      const adr: UserEntity = await this._userService.getUserByNickname(
        addressee,
      );
      if (adr.id === req.id)
        throw new BadRequestException(
          'Requester and addressee are the same person',
        );
      const friendship = await this.findFriendship(req, adr);
      if (
        friendship &&
        friendship.status === 'invitation' &&
        friendship.addresseeId == req.id
      )
        result = this._friendshipRepository.remove(friendship);
      else
        throw new BadRequestException('Friendship not found or wrong status');
    } catch (error) {
      console.log(error);
    }
    return result;
  }

  async unfriend(
    requester: string,
    addressee: string,
  ): Promise<FriendshipEntity> {
    let result: Promise<FriendshipEntity>;

    try {
      const req: UserEntity = await this._userService.getUserByNickname(
        requester,
      );
      const adr: UserEntity = await this._userService.getUserByNickname(
        addressee,
      );
      if (adr.id === req.id)
        throw new BadRequestException(
          'Requester and addressee are the same person',
        );
      const friendship = await this.findFriendship(req, adr);
      if (friendship && friendship.status === 'friend') {
        result = this._friendshipRepository.remove(friendship);
      } else
        throw new BadRequestException('Friendship not found or wrong status');
    } catch (error) {
      console.log(error);
    }
    return result;
  }

  async blockFriendship(
    requester: string,
    addressee: string,
  ): Promise<FriendshipEntity> {
    let result: Promise<FriendshipEntity>;

    try {
      const req: UserEntity = await this._userService.getUserByNickname(
        requester,
      );
      const adr: UserEntity = await this._userService.getUserByNickname(
        addressee,
      );
      if (adr.id === req.id)
        throw new BadRequestException(
          'Requester and addressee are the same person',
        );
      const friendship = await this.findFriendship(req, adr);
      if (
        friendship &&
        friendship.status === 'invitation' &&
        friendship.requesterId === adr.id
      ) {
        this._friendshipRepository.remove(friendship);
        const blocked = this._friendshipRepository.create({
          requester: req,
          addressee: adr,
          status: 'blocked',
        });
        result = this._friendshipRepository.save(blocked);
      } else
        throw new BadRequestException('Friendship not found or wrong status');
    } catch (error) {
      console.log(error);
    }
    return result;
  }

  async getRelationsOf(username: string) {
    try {
      const user: UserEntity = await this._userService.getUserByNickname(
        username,
      );
      return {
        invitations: await this.findInvitationsOf(user),
        friends: await this.findFriendsOf(user),
      };
    } catch (error) {
      console.log(error);
    }
    return null;
  }
}
