import { forwardRef, Module } from '@nestjs/common';
import { UserModule } from 'src/user/user.module';
import { ServerService } from './server.service';
import { ServerGateway } from './server.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchHistoryEntity } from './entities/match_history.entity';
import { UserService } from 'src/user/user.service';
import { PrivateConvService } from 'src/private_conv/private_conv.service';
import { PrivateConvModule } from 'src/private_conv/private_conv.module';
import { PrivateMessageEntity } from 'src/private_conv/entities/privateMessage.entity';
import { PrivateConvEntity } from 'src/private_conv/entities/private_conv.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MatchHistoryEntity,
      PrivateMessageEntity,
      PrivateConvEntity,
    ]),
    UserModule,
    PrivateConvModule,
  ],
  providers: [ServerGateway, ServerService, PrivateConvService],
  exports: [ServerService],
})
export class ServerModule {}
