import { configService } from 'src/config/config.service';
require('dotenv').config();

export const jwtConstants = {
  secret: process.env.JWT_KEY,
};
