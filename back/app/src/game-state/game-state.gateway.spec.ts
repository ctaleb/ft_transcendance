import { Test, TestingModule } from '@nestjs/testing';
import { GameStateGateway } from './game-state.gateway';
import { GameStateService } from './game-state.service';

describe('GameStateGateway', () => {
  let gateway: GameStateGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameStateGateway, GameStateService],
    }).compile();

    gateway = module.get<GameStateGateway>(GameStateGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
