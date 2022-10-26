import { Module } from '@nestjs/common';
import { PrivateConvService } from './private_conv.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/user/user.entity';

@Module({
  providers: [PrivateConvService],
  //  imports: [TypeOrmModule.forFeature([UserEntity])],
})
export class PrivateConvModule {}
