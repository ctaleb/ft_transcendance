import { UserEntity } from 'src/user/user.entity';

export enum ChannelType {
  PUBLIC = 'public',
  PRIVATE = 'private',
  PROTECTED = 'protected',
}

export enum ChannelRole {
  ADMIN = 'administrator',
  MEMBER = 'member',
}

export class Channel {
  name: string;
  room: string;
  type: ChannelType;
  password: string;
  owner: UserEntity;
  mutedUsers: number[]; // time to add
  bannedUsers: number[];
  members: ChannelMember[];
  messages: ChannelMessage[];
}

export class ChannelMember {
  role: ChannelRole;
  id: number;
}

export class ChannelMessage {
  senderId: number;
  content: string;
}
