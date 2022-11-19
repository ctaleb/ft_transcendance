import { User } from "@/types/User";

export interface Channel {
  id: number;
  name: string;
  type: ChannelType;
  passwordField: string;
  members: number[];
}

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
