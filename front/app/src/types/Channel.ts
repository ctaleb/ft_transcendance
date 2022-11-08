export interface Channel {
  id: number;
  name: string;
  type: ChannelType;
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
