import { User } from "@/types/User";
import { Pictured } from "./Utils";

export enum ChannelType {
  PUBLIC = "public",
  PRIVATE = "private",
  PROTECTED = "protected",
}

export enum ChannelRole {
  OWNER = "owner",
  ADMIN = "administrator",
  MEMBER = "member",
}

export interface ChannelUser extends User {
  role: ChannelRole;
}

export interface Message {
  text: string;
  author: string;
  date: Date;
}

export class BaseChannel {
  messages: Message[] = [];
}

export class Channel extends BaseChannel {
  id!: number;
  name!: string;
  type!: ChannelType;
  members!: number[];
}

export class Conversation extends BaseChannel implements Pictured {
  uuid!: string;
  other!: User;
  notif!: boolean;

  getPicture(): string {
    return this.other.avatar;
  }
}
