import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
var fs = require('fs');
var request = require('request');
import { authorize } from 'passport';
import { json } from 'stream/consumers';
import { CreateOauthDto } from './dto/create-oauth.dto';
import { UpdateOauthDto } from './dto/update-oauth.dto';
import { imageFileFilter } from 'src/utils/file-uploading.utils';
import { ConfigService } from '@nestjs/config';
import { AuthenticationService } from 'src/authentication/authentication.service';

@Injectable()
export class OauthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    private configService: ConfigService,
    private authenticationService: AuthenticationService,
  ) {}
  async check42NicknameUsed(originalLogin: string) {
    let userCheck;
    try {
      userCheck = await this.userService.getUserByNickname(originalLogin);
    } catch {
      return originalLogin;
    }
    let loginToTest = originalLogin;
    let count = 1;
    while (userCheck) {
      loginToTest = originalLogin + String(count++);
      try {
        userCheck = await this.userService.getUserByNickname(loginToTest);
      } catch {
        return loginToTest;
      }
    }
    return originalLogin;
  }

  async connect(code: string): Promise<any> {
    const token = await fetch('https://api.intra.42.fr/oauth/token', {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body:
        'grant_type=authorization_code&client_id=' +
        this.configService.get<string>('VUE_APP_42_ID') +
        '&client_secret=' +
        this.configService.get<string>('42_SECRET') +
        '&redirect_uri=http%3A%2F%2Flocalhost%3A4000%2F&code=' +
        code,
      method: 'POST',
    })
      .then((val) => val.json())
      .then(async (token) => {
        if (token.access_token == null) {
          throw UnauthorizedException;
        }
        await fetch('https://api.intra.42.fr/v2/me', {
          headers: {
            Authorization: 'Bearer ' + token.access_token,
          },
        })
          .then((val) => val.json())
          .then(async (res) => {
            await this.userService
              .getIntraUserById(res.id)
              .catch(async (err) => {
                res.login = await this.check42NicknameUsed(res.login);
                const registrationDto = {
                  nickname: res.login,
                  phone: res.phone,
                  intraId: res.id,
                };
                const filename: string =
                  res.login + '.' + getUrlExtension(res.image_url);
                const file_path: string = './assets/' + filename;
                download(res.image_url, file_path, function () {
                  console.log('done');
                });
                await this.authenticationService.registration(registrationDto, {
                  filename: filename,
                  path: './assets/' + filename,
                  mimetype: 'image/jpeg',
                });
              });
          });
        return token;
      })
      .catch((err) => {
        console.log(err);
      });
    return token;
  }

  async login(token: any) {
    const ret: any = await fetch('https://api.intra.42.fr/v2/me', {
      headers: {
        Authorization: 'Bearer ' + token,
      },
    })
      .then((val) => {
        return val.json();
      })
      .then(async (user) => {
        const intraUser = await this.userService.getIntraUserById(user.id);
        return { token: this.jwtService.sign(intraUser), user: intraUser };
      })
      .catch((err) => {
        console.log(err);
      });
    return { token: ret.token, user: ret.user };
  }
}
function download(uri, filename, callback) {
  request.head(uri, function (err, res, body) {
    console.log('content-type:', res.headers['content-type']);
    console.log('content-length:', res.headers['content-length']);

    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
}

const getUrlExtension = (url) => {
  return url.split(/[#?]/)[0].split('.').pop().trim();
};
