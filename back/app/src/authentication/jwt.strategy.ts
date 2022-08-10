import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable} from '@nestjs/common';
import { jwtConstants } from './constants';
import { Request } from "express";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      ignoreExpiration: false,
      secretOrKey:"My random secret key never let others",
      jwtFromRequest:ExtractJwt.fromExtractors([(request:Request) => {
          let data = request?.cookies.access_token;
          if(!data){
              return null;
          }
          return data.token
      }])
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username };
  }
}