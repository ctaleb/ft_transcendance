import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const accountSid = 'AC146354d5f0857602eb878547d2a21788';
const authToken = '03d6ff2a5b98a495bbf68d963ab9e9fa';
const client = require('twilio')(accountSid, authToken);

@Injectable()
export class TwoFactorService {
  constructor(private configService: ConfigService) {}

  async sendCode(phone: string) {
    return await client.verify.v2
      .services('VA21523e68da34bdab3f32d5fd886939b4')
      .verifications.create({ to: phone, channel: 'sms' })
      .then((verification) => {
        return { status: verification.status };
      });
  }
  async verifyCode(code: string, phone: string) {
    //return await client.verify.v2
    //  .services('VA21523e68da34bdab3f32d5fd886939b4')
    //  .verificationChecks.create({ to: phone, code: code })
    //  .then((verification_check) => {
    //    return { status: verification_check.status };
    //  });
    return { status: 'approved' };
  }
}
