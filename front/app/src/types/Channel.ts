import { User } from "@/types/User";
import { Message } from "@/types/Message";
import { Conversation } from "@/types/Conversation";

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

export interface Channel {
  id: number;
  name: string;
  type: ChannelType;
  members?: number[];
  messages?: Message[];
}

export function isChannel(chatEntity: Channel | Conversation) {
  return (<Channel>chatEntity).name !== undefined;
}

export namespace Channel {
  export function getName(channel: Channel): string {
    return channel.name;
  }
}
