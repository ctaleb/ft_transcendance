import { Module } from '@nestjs/common';
import { twoFactorController } from './twoFactorAuth.controller';
import { TwoFactorService } from './twoFactorAuth.service';

@Module({
  imports: [],
  controllers: [twoFactorController],
  providers: [TwoFactorService],
})
export class twofactorModule {}
