import { Module } from '@nestjs/common';
import { UserModule } from 'src/user/user.module';
import { ServerService } from './server.service';
import { ServerGateway } from './server.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchHistoryEntity } from './entities/match_history.entity';
import { UserService } from 'src/user/user.service';

@Module({
  imports: [TypeOrmModule.forFeature([MatchHistoryEntity]), UserModule],
  providers: [ServerGateway, ServerService],
  exports: [ServerService],
})
export class ServerModule {}
