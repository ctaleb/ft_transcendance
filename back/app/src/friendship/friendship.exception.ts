import { BadRequestException } from '@nestjs/common';

export class FriendshipAlreadyExistsException extends BadRequestException {
  constructor(error?: string) {
    super('Friendship already exists', error);
  }
}

export class BlockedFriendshipException extends BadRequestException {
  constructor(error?: string) {
    super('Blocked friendship relation', error);
  }
}

export class CannotAcceptFriendshipRequestException extends BadRequestException {
  constructor(error?: string) {
    super('Cannot accept friendship request', error);
  }
}
