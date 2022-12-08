import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { UserEntity } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';
import { FriendshipEntity } from './entities/friendship.entity';
import { BlockedFriendshipException, CannotAcceptFriendshipRequestException, FriendshipAlreadyExistsException } from './friendship.exception';

@Injectable()
export class FriendshipService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private _userService: UserService,
  ) {}

  async invite(requester: string, addressee: string): Promise<FriendshipEntity> {
    const req: UserEntity = await this._userService.getUserByNickname(requester);
    const adr: UserEntity = await this._userService.getUserByNickname(addressee);
    if (adr.id === req.id) throw new BadRequestException('Requester and addressee are the same person');
    const friendship = await this.findFriendship(req.id, adr.id);
    if (friendship) {
      if (friendship.status !== 'blocked') throw new FriendshipAlreadyExistsException();
      else throw new BlockedFriendshipException(); // if I blocked someone or the other way
    }
    const invitation: FriendshipEntity = FriendshipEntity.create({
      requester: req,
      addressee: adr,
      status: 'invitation',
    });
    const result = await FriendshipEntity.save(invitation);
    return result;
  }

  async findFriendship(requesterId: number, addresseeId: number) {
    let friendship: FriendshipEntity;
    friendship = await FriendshipEntity.findOneBy({
      requesterId: requesterId,
      addresseeId: addresseeId,
    });
    if (friendship === null) {
      friendship = await FriendshipEntity.findOneBy({
        requesterId: addresseeId,
        addresseeId: requesterId,
      });
    }
    return friendship;
  }

  async findInvitationsOf(user: UserEntity) {
    const invitations = await FriendshipEntity.findBy({
      addresseeId: user.id,
      status: 'invitation',
    }).then(async (data) => {
      const invits: UserEntity[] = [];
      for (const entity of data) {
        const invite = await this._userService.getUserById(entity.requesterId);
        invits.push(invite);
      }
      return invits;
    });
    return invitations;
  }

  async findFriendsOf(user: UserEntity) {
    const friends = await FriendshipEntity.find({
      where: [
        {
          addresseeId: user.id,
          status: 'friend',
        },
        {
          requesterId: user.id,
          status: 'friend',
        },
      ],
    }).then(async (data) => {
      const result: UserEntity[] = [];
      for (const entity of data) {
        if (entity.requesterId === user.id) result.push(await this._userService.getUserById(entity.addresseeId));
        else result.push(await this._userService.getUserById(entity.requesterId));
      }
      return result;
    });
    return friends;
  }

  async befriend(requester: string, addressee: string): Promise<FriendshipEntity> {
    let result: Promise<FriendshipEntity>;

    const req: UserEntity = await this._userService.getUserByNickname(requester);
    const adr: UserEntity = await this._userService.getUserByNickname(addressee);
    if (adr.id === req.id) throw new BadRequestException('Requester and addressee are the same person');
    const friendship = await this.findFriendship(req.id, adr.id);
    if (friendship && friendship.status === 'invitation' && friendship.requesterId === adr.id) {
      friendship.status = 'friend';
      result = FriendshipEntity.save(friendship);
    } else throw new CannotAcceptFriendshipRequestException();
    return result;
  }

  async declineFriendship(requester: string, addressee: string): Promise<FriendshipEntity> {
    let result: Promise<FriendshipEntity>;

    const req: UserEntity = await this._userService.getUserByNickname(requester);
    const adr: UserEntity = await this._userService.getUserByNickname(addressee);
    if (adr.id === req.id) throw new BadRequestException('Requester and addressee are the same person');
    const friendship = await this.findFriendship(req.id, adr.id);
    if (friendship && friendship.status === 'invitation' && friendship.addresseeId == req.id) result = FriendshipEntity.remove(friendship);
    else throw new BadRequestException('Friendship not found or wrong status');
    return result;
  }

  async unfriend(requester: string, addressee: string): Promise<FriendshipEntity> {
    let result: Promise<FriendshipEntity>;

    const req: UserEntity = await this._userService.getUserByNickname(requester);
    const adr: UserEntity = await this._userService.getUserByNickname(addressee);
    if (adr.id === req.id) throw new BadRequestException('Requester and addressee are the same person');
    const friendship = await this.findFriendship(req.id, adr.id);
    if (friendship && friendship.status === 'friend') {
      result = FriendshipEntity.remove(friendship);
      // this._serverService.PlayerToSocket(adr.nickname).emit('removeFriend', req);
    } else throw new BadRequestException('Friendship not found or wrong status');
    return result;
  }

  async block(requester: string, addressee: string): Promise<FriendshipEntity> {
    let result: Promise<FriendshipEntity>;

    const req: UserEntity = await this._userService.getUserByNickname(requester);
    const adr: UserEntity = await this._userService.getUserByNickname(addressee);
    if (adr.id === req.id) throw new BadRequestException('Requester and addressee are the same person');
    const duplicate = await FriendshipEntity.findOneBy({ requester: { id: req.id }, addressee: { id: adr.id }, status: 'blocked' });
    if (duplicate) throw new BadRequestException('The user is already blocked');
    const friendship = await this.findFriendship(req.id, adr.id);
    if (friendship && friendship.status !== 'blocked') {
      FriendshipEntity.remove(friendship);
      const blocked = FriendshipEntity.create({
        requester: req,
        addressee: adr,
        status: 'blocked',
      });
      result = FriendshipEntity.save(blocked);
    } else if (friendship === null) {
      const blocked = FriendshipEntity.create({
        requester: req,
        addressee: adr,
        status: 'blocked',
      });
      result = FriendshipEntity.save(blocked);
    } else if (friendship.addresseeId === req.id) {
      const blocked = FriendshipEntity.create({
        requester: req,
        addressee: adr,
        status: 'blocked',
      });
      result = FriendshipEntity.save(blocked);
    }
    return result;
  }

  async unblock(requester: string, addressee: string): Promise<FriendshipEntity> {
    let result: Promise<FriendshipEntity>;
    const req: UserEntity = await this._userService.getUserByNickname(requester);
    const adr: UserEntity = await this._userService.getUserByNickname(addressee);
    if (adr.id === req.id) throw new BadRequestException('Requester and addressee are the same person');
    const friendship = await FriendshipEntity.findOneBy({
      requesterId: req.id,
      addresseeId: adr.id,
      status: 'blocked',
    });
    if (friendship) {
      result = FriendshipEntity.remove(friendship);
    } else {
      throw new BadRequestException('Friendship not found or wrong status');
    }
    return result;
  }

  async getRelationsOf(username: string) {
    const user: UserEntity = await this._userService.getUserByNickname(username);
    return {
      invitations: await this.findInvitationsOf(user),
      friends: await this.findFriendsOf(user),
    };
    return null;
  }

  async getBlockedStatus(requesterID: number, addresseeID: number) {
    const status = await FriendshipEntity.findOneBy({
      requester: { id: requesterID },
      addressee: { id: addresseeID },
      status: 'blocked',
    });
    if (status) return true;
    return false;
  }
}
