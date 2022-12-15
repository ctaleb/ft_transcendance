import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthenticationService } from 'src/authentication/authentication.service';
import { UserEntity } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';
import { intraUser } from './entities/oauth.entity';
var fs = require('fs');
var request = require('request');

@Injectable()
export class OauthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    private configService: ConfigService,
    private authenticationService: AuthenticationService,
  ) {}

  async connect(code: string): Promise<any> {
    const token = await this.getIntraToken(code);
    if (token.access_token == null) {
      throw new UnauthorizedException('No access token');
    }
    const user: intraUser = await this.fetchUserFromIntra(token.access_token);
    await this.userService.getIntraUserById(user.id).catch(async () => {
      this.registerNewStudentUser(user);
    });
    return token;
  }

  async login(token: string) {
    try {
      const intraUser = await this.fetchUserFromIntra(token);
      const user = await this.userService.getIntraUserById(intraUser.id);
      return { token: this.jwtService.sign(user), user: user };
    } catch (error) {}
  }

  //utils
  async getIntraToken(code: string) {
    const token = await fetch('https://api.intra.42.fr/oauth/token', {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body:
        'grant_type=authorization_code&client_id=' +
        this.configService.get<string>('VUE_APP_42_ID') +
        '&client_secret=' +
        this.configService.get<string>('VUE_APP_42_SECRET') +
        '&redirect_uri=' +
        this.configService.get<string>('VUE_APP_42_URI') +
        '&code=' +
        code,
      method: 'POST',
    })
      .then((val) => val.json())
      .then((token) => {
        return token;
      })
      .catch((err) => {});
    return token;
  }

  async fetchUserFromIntra(access_token: string): Promise<intraUser> {
    const user = await fetch('https://api.intra.42.fr/v2/me', {
      headers: {
        Authorization: 'Bearer ' + access_token,
      },
    })
      .then((val) => val.json())
      .then((data) => {
        return data;
      })
      .catch((err) => {});
    return user;
  }

  async registerNewStudentUser(user: intraUser) {
    user.login = await this.check42NicknameUsed(user.login);
    const registrationDto = {
      nickname: user.login,
      intraId: user.id,
    };
    const filename: string = user.login + '.' + getUrlExtension(user.image.link);
    const file_path: string = 'assets/' + filename;
    download(user.image.link, file_path, function () {});
    await this.authenticationService.registration(
      registrationDto,
      {
        filename: filename,
        path: './assets/' + filename,
        mimetype: 'image/jpeg',
      },
      true,
    );
  }

  async check42NicknameUsed(originalLogin: string) {
    let userCheck: UserEntity;
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
}

function download(uri, filename, callback) {
  request.head(uri, function (err, res, body) {
    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
}

const getUrlExtension = (url) => {
  return url.split(/[#?]/)[0].split('.').pop().trim();
};
