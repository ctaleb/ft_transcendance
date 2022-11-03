import { Module } from '@nestjs/common';
import { PrivateConvService } from './private_conv.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/user/user.entity';
import { PrivateMessageEntity } from './entities/privateMessage.entity';
import { PrivateConvEntity } from './entities/private_conv.entity';

@Module({
  providers: [PrivateConvService],
  imports: [
    TypeOrmModule.forFeature([PrivateMessageEntity, PrivateConvEntity]),
  ],
})
export class PrivateConvModule {}
