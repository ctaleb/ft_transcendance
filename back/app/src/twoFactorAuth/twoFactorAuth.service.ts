import { Injectable } from '@nestjs/common';
require('dotenv').config();

@Injectable()
export class TwoFactorService {
  constructor() {}

  accountSid = process.env.TWILIO_SID;
  authToken = process.env.TWILIO_TOKEN;
  client = require('twilio')(this.accountSid, this.authToken);
  async sendCode(phone: string) {
    return await this.client.verify.v2
      .services(process.env.TWILIO_SERVICE)
      .verifications.create({ to: phone, channel: 'sms' })
      .then((verification) => {
        return { status: verification.status };
      });
  }
  async verifyCode(code: string, phone: string) {
    return await this.client.verify.v2
      .services(process.env.TWILIO_SERVICE)
      .verificationChecks.create({ to: phone, code: code })
      .then((verification_check) => {
        return { status: verification_check.status };
      });
  }
}
