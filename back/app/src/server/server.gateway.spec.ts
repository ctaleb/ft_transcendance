import { Test, TestingModule } from '@nestjs/testing';
import { ServerGateway } from './server.gateway';
import { ServerService } from './server.service';

describe('MessagesGateway', () => {
  let gateway: ServerGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServerGateway, ServerService],
    }).compile();

    gateway = module.get<ServerGateway>(ServerGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
