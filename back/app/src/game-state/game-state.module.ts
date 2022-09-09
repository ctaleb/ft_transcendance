import { Module } from '@nestjs/common';
import { GameStateService } from './game-state.service';
import { GameStateGateway } from './game-state.gateway';

@Module({
  providers: [GameStateGateway, GameStateService],
})
export class GameStateModule {}
