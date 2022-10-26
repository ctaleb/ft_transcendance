import { Injectable } from '@nestjs/common';
import { Channel } from '../server/entities/channel';

@Injectable()
export class ChatService {
  channels: Channel[] = [];
}
