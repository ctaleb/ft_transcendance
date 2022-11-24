import { BadRequestException, forwardRef, HttpException, Inject, Injectable } from '@nestjs/common';
import { FriendshipEntity } from './entities/friendship.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from 'src/user/user.service';
import { UserEntity } from 'src/user/user.entity';
import { BlockedFriendshipException, CannotAcceptFriendshipRequestException, FriendshipAlreadyExistsException } from './friendship.exception';
import { ServerService } from 'src/server/server.service';

@Injectable()
export class FriendshipService {
  @Inject(ServerService)
  private readonly _serverService: ServerService;
  constructor(
    @InjectRepository(FriendshipEntity)
    private _friendshipRepository: Repository<FriendshipEntity>,
    @Inject(forwardRef(() => UserService))
    private _userService: UserService,
  ) {}

  async invite(requester: string, addressee: string): Promise<FriendshipEntity> {
    let result: FriendshipEntity;

    const req: UserEntity = await this._userService.getUserByNickname(requester);
    const adr: UserEntity = await this._userService.getUserByNickname(addressee);
    if (adr.id === req.id) throw new BadRequestException('Requester and addressee are the same person');
    const friendship = await this.findFriendship(req, adr);
    if (friendship) {
      if (friendship.status !== 'blocked') throw new FriendshipAlreadyExistsException();
      else throw new BlockedFriendshipException(); // if I blocked someone or the other way
    }
    const invitation: FriendshipEntity = this._friendshipRepository.create({
      requester: req,
      addressee: adr,
      status: 'invitation',
    });
    result = await this._friendshipRepository.save(invitation);
    const invited = this._serverService.userList.find((element) => element.name === addressee);
    invited?.socket.emit('friendshipInvite', req);
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
          const invite = await this._userService.getUserById(entity.requesterId);
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
    const friendship = await this.findFriendship(req, adr);
    if (friendship && friendship.status === 'invitation' && friendship.requesterId === adr.id) {
      friendship.status = 'friend';
      result = this._friendshipRepository.save(friendship);
      this._serverService.PlayerToSocket(adr.nickname).emit('acceptInvite', req);
    } else throw new CannotAcceptFriendshipRequestException();
    return result;
  }

  async declineFriendship(requester: string, addressee: string): Promise<FriendshipEntity> {
    let result: Promise<FriendshipEntity>;

    const req: UserEntity = await this._userService.getUserByNickname(requester);
    const adr: UserEntity = await this._userService.getUserByNickname(addressee);
    if (adr.id === req.id) throw new BadRequestException('Requester and addressee are the same person');
    const friendship = await this.findFriendship(req, adr);
    if (friendship && friendship.status === 'invitation' && friendship.addresseeId == req.id) result = this._friendshipRepository.remove(friendship);
    else throw new BadRequestException('Friendship not found or wrong status');
    return result;
  }

  async unfriend(requester: string, addressee: string): Promise<FriendshipEntity> {
    let result: Promise<FriendshipEntity>;

    const req: UserEntity = await this._userService.getUserByNickname(requester);
    const adr: UserEntity = await this._userService.getUserByNickname(addressee);
    if (adr.id === req.id) throw new BadRequestException('Requester and addressee are the same person');
    const friendship = await this.findFriendship(req, adr);
    if (friendship && friendship.status === 'friend') {
      result = this._friendshipRepository.remove(friendship);
      this._serverService.PlayerToSocket(adr.nickname).emit('removeFriend', req);
    } else throw new BadRequestException('Friendship not found or wrong status');
    return result;
  }

  async block(requester: string, addressee: string): Promise<FriendshipEntity> {
    let result: Promise<FriendshipEntity>;

    const req: UserEntity = await this._userService.getUserByNickname(requester);
    const adr: UserEntity = await this._userService.getUserByNickname(addressee);
    if (adr.id === req.id) throw new BadRequestException('Requester and addressee are the same person');
    const friendship = await this.findFriendship(req, adr);
    if (friendship && friendship.status !== 'blocked') {
      this._friendshipRepository.remove(friendship);
      const blocked = this._friendshipRepository.create({
        requester: req,
        addressee: adr,
        status: 'blocked',
      });
      result = this._friendshipRepository.save(blocked);
    } else if (friendship === null) {
      const blocked = this._friendshipRepository.create({
        requester: req,
        addressee: adr,
        status: 'blocked',
      });
      result = this._friendshipRepository.save(blocked);
    } else if (friendship.addresseeId === req.id) {
      const blocked = this._friendshipRepository.create({
        requester: req,
        addressee: adr,
        status: 'blocked',
      });
      result = this._friendshipRepository.save(blocked);
    }
    return result;
  }

  async unblock(requester: string, addressee: string): Promise<FriendshipEntity> {
    let result: Promise<FriendshipEntity>;

    const req: UserEntity = await this._userService.getUserByNickname(requester);
    const adr: UserEntity = await this._userService.getUserByNickname(addressee);
    if (adr.id === req.id) throw new BadRequestException('Requester and addressee are the same person');
    const friendship = await this._friendshipRepository.findOneBy({
      requesterId: req.id,
      addresseeId: adr.id,
      status: 'blocked',
    });
    if (friendship) {
      this._friendshipRepository.remove(friendship);
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

  async hasPendingInvitations(username: string) {
    //   const user: UserEntity = await this._userService.getUserByNickname(
    //     username,
    //   );
    //   return (await this.findInvitationsOf(user)).length === 0 ? false : true;
    // } catch (error) {
    //   console.log(error);
    // }
    return false;
  }
}
