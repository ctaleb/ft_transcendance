import { ChannelType } from 'src/chat/entities/channel.entity';

export interface IChannel {
  id: number;
  name: string;
  type: ChannelType;
  members?: number[];
  messages?: IMessage[];
}

export interface IMessage {
  author: string;
  text: string;
  date: Date;
}
