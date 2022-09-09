import { Test, TestingModule } from '@nestjs/testing';
import { GameStateService } from './game-state.service';

describe('GameStateService', () => {
  let service: GameStateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameStateService],
    }).compile();

    service = module.get<GameStateService>(GameStateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
