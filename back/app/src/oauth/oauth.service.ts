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

@Injectable()
export class OauthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    private configService: ConfigService,
  ) {}
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
            const user = await fetch(
              'http://localhost:3000/api/user/findIntraUser/' + res.id,
              {
                method: 'GET',
              },
            ).then((res) => {
              return res.json();
            });
            if (user.message) {
              const formData = new FormData();
              formData.append('nickname', res.login);
              formData.append('phone', res.phone);
              formData.append('intraId', res.id);
              const filename: string =
                res.login + '.' + getUrlExtension(res.image_url);
              const file_path: string = './assets/' + filename;
              download(res.image_url, file_path, function () {
                console.log('done');
              });
              await fetch(
                'http://localhost:3000/api/authentication/registration',
                {
                  method: 'POST',
                  body: formData,
                },
              ).catch((err) => {
                console.log(err);
              });
              await fetch(
                'http://localhost:3000/api/user/findIntraUser/' + res.id,
                {
                  method: 'GET',
                },
              )
                .then((value) => value.json())
                .then(async (result) => {
                  this.userService.setAvatar(result.id, {
                    filename: filename,
                    path: './assets/' + filename,
                    mimetype: 'image/jpeg',
                  });
                });
            }
          })
          .catch((err) => {
            console.log(err);
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
        const intraUser = await fetch(
          'http://localhost:3000/api/user/findIntraUser/' + user.id,
          {
            method: 'GET',
          },
        )
          .then((res) => {
            return res.json();
          })
          .catch((err) => {
            console.log(err);
          });
        const payload = { username: user.login, sub: user.id };
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
