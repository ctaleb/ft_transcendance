import { Test, TestingModule } from '@nestjs/testing';
import { PrivateConvService } from './private_conv.service';

describe('PrivateConvService', () => {
  let service: PrivateConvService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrivateConvService],
    }).compile();

    service = module.get<PrivateConvService>(PrivateConvService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
