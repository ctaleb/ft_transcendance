export interface Channel {
  id: number;
  name: string;
  type: ChannelType;
  passwordField: string;
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
