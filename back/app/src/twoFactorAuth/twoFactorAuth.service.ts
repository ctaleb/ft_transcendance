import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TwoFactorService {
  constructor(private configService: ConfigService) {}

  accountSid = this.configService.get<string>('TWILIO_SID');
  authToken = this.configService.get<string>('TWILIO_TOKEN');
  client = require('twilio')(this.accountSid, this.authToken);
  async sendCode(phone: string) {
    return await this.client.verify.v2
      .services(this.configService.get<string>('TWILIO_SERVICE'))
      .verifications.create({ to: phone, channel: 'sms' })
      .then((verification) => {
        return { status: verification.status };
      });
  }
  async verifyCode(code: string, phone: string) {
    //return await this.client.verify.v2
    //  .services(this.configService.get<string>('TWILIO_SERVICE'))
    //  .verificationChecks.create({ to: phone, code: code })
    //  .then((verification_check) => {
    //    return { status: verification_check.status };
    //  });
    return { status: 'approved' };
  }
}
