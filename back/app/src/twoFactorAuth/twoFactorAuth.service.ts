import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TwoFactorService {
  constructor(private configService: ConfigService) {}

  async steptwo(phone: string) {}
}
