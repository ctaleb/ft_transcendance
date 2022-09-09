import { Injectable, UnauthorizedException } from '@nestjs/common';
import { authorize } from 'passport';
import { CreateOauthDto } from './dto/create-oauth.dto';
import { UpdateOauthDto } from './dto/update-oauth.dto';

@Injectable()
export class OauthService {
  async connect(code: string): Promise<any> {
      let token = await fetch("https://api.intra.42.fr/oauth/token", {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      body: 'grant_type=authorization_code&client_id=1a90768d9956eae0b0360b4588273a1d4a25143a9c8cfc6a0330dac17b9684db&client_secret=fc3b24dee46ae52d1c335e8ef794d2de3dcd530b97fa22aeb19267de032a9f49&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2F&code=' + code,
      method: "POST"
    })
    .then((val) => val.json())
    .then((token) => {
      if (token.access_token == null)
      {
        console.log("Not a 42 user");
        throw(UnauthorizedException);
      }
      fetch("https://api.intra.42.fr/v2/me", {
				headers: {
					"Authorization": "Bearer " + token.access_token,
				},
			})
			.then((val) => val.json())
			.then(async (res) => {
        let ifExists = await fetch("http://localhost:3000/api/user/findIntraUser/" + res.id, {
          method: "GET",
       })
       .then((res) => {return res.json()})
       console.log(ifExists);
       if (ifExists.message)
       {
          console.log("THIS USER DOES NOT EXISTS");
          var formData = new FormData();
          formData.append("nickname", res.login);
          formData.append("phone", res.phone);
          formData.append("intraId", res.id);
          fetch("http://localhost:3000/api/authentication/registration", {
              method: "POST",
              body: formData,
          })
         throw(UnauthorizedException)
       }
			})
      .catch((err) => {console.log(err)})
      return token;
    })
    .catch((err) => {console.log(err)})
    return token;
  }
}
