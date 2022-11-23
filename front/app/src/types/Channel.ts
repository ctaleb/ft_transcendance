import { User } from "@/types/User";
import { Message } from "@/types/Message";

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

export namespace Channel {
  export function getName(channel: Channel): string {
    return channel.name;
  }
}
