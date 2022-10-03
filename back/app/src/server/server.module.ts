import { Module } from '@nestjs/common';
import { ServerService } from './server.service';
import { ServerGateway } from './server.gateway';

@Module({
  providers: [ServerGateway, ServerService],
  exports: [ServerService],
})
export class ServerModule {}
