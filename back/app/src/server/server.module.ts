import { forwardRef, Module } from '@nestjs/common';
import { UserModule } from 'src/user/user.module';
import { ServerService } from './server.service';
import { ServerGateway } from './server.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchHistoryEntity } from './entities/match_history.entity';
import { UserService } from 'src/user/user.service';
import { ChatModule } from 'src/chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MatchHistoryEntity]),
    ChatModule,
    UserModule,
  ],
  providers: [ServerGateway, ServerService],
  exports: [ServerService],
})
export class ServerModule {}
