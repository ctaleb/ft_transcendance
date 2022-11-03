import { Test, TestingModule } from '@nestjs/testing';
import { PrivateConvService } from './private_conv.service';

describe('PrivateConvGateway', () => {
  let gateway: PrivateConvGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrivateConvGateway, PrivateConvService],
    }).compile();

    gateway = module.get<PrivateConvGateway>(PrivateConvGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
