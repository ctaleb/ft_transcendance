import { Module } from '@nestjs/common';
import { UserModule } from 'src/user/user.module';
import { ServerService } from './server.service';
import { ServerGateway } from './server.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchHistoryEntity } from './entities/match_history.entity';

@Module({
  imports: [UserModule, TypeOrmModule.forFeature([MatchHistoryEntity])],
  providers: [ServerGateway, ServerService],
  exports: [ServerService],
})
export class ServerModule {}
