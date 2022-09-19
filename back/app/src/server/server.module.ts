import { Module } from '@nestjs/common';
import { MessagesService } from './server.service';
import { MessagesGateway } from './server.gateway';

@Module({
  providers: [MessagesGateway, MessagesService],
})
export class MessagesModule {}
