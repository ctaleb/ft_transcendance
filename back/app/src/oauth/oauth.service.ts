import { Injectable } from '@nestjs/common';
import { authorize } from 'passport';
import { CreateOauthDto } from './dto/create-oauth.dto';
import { UpdateOauthDto } from './dto/update-oauth.dto';

@Injectable()
export class OauthService {
  connect(code: string) {
    
    fetch("https://api.intra.42.fr/oauth/token", {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: "1a90768d9956eae0b0360b4588273a1d4a25143a9c8cfc6a0330dac17b9684db",
        client_secret: "fc3b24dee46ae52d1c335e8ef794d2de3dcd530b97fa22aeb19267de032a9f49",
        code: code,
        redirect_uri: "http%3A%2F%2Flocalhost%3A3000%2F",
      }),
      method: "POST"
    })
    .then((val) => val.json())
    .then((ret) => {console.log(ret)})
    .catch((err) => {console.log(err)})
  }
}
