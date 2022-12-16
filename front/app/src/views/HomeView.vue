<template>
  <div class="principalSection">
    <div class="mainContainer">
      <img src="../assets/logo.gif" width="270" height="270" alt="" />
      <div class="twofaComponentDiv" v-if="twofaFlag == true">
        <two-factor-component class="twoFactorComponent" v-model="codeValidated" @twofaSuccessClassicUser="login" @twofaSuccessIntraUser="studentLogin" />
      </div>
      <register-component v-if="displayRegister == true" v-model="displayRegister" />
      <div v-if="twofaFlag == false && displayRegister == false" style="width: 100%">
        <div class="classicLogin">
          <form @submit.prevent="login" style="margin-bottom: 2em">
            <input class="input" placeholder="Username" v-model="username" type="text" id="username" name="username" required /><br /><br />
            <input class="input" placeholder="Password" v-model="password" type="password" id="password" name="password" required /><br /><br />
            <button type="submit" value="Connexion" class="button classic_login_btn pulse">Login</button>
          </form>
        </div>
        <div class="sectionDivider">
          <hr class="solid divider" />
          <h4>Or</h4>
          <hr class="solid divider" />
        </div>
        <div class="intraLogin">
          <button class="button pulse" @click="redirectTo(intra_redirection)">Continue with 42</button>
        </div>
      </div>
      <div class="register" v-if="twofaFlag == false && displayRegister == false">
        <p>Don't have an account yet ?</p>
        <button class="button pulse" @click="displayRegister = true">New account</button>
      </div>
    </div>
    <div class="svgSection">
      <img src="../assets/taken.svg" alt="" />
    </div>
  </div>
  <!--   <div :style="{ color: login_failed_color }" v-if="login_failed_msg"> -->
  <div class="text-red" v-if="login_failed_msg">Login failed. Please try again.</div>
  <div class="footer">
    <h2>Welcome to Superpong</h2>
    <div class="howToPlay">
      <div class="howToPlaySection">
        <i class="gg-log-in gg-icon"></i>
        <h4>Register</h4>
      </div>
      <div class="howToPlaySection">
        <i class="gg-games gg-icon"></i>
        <h4>Play</h4>
      </div>
      <div class="howToPlaySection">
        <i class="gg-comment gg-icon"></i>
        <h4>Chat with your friends</h4>
      </div>
    </div>
  </div>

  <svg class="bottomSvg" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
    <path
      fill="#C1A36B"
      fill-opacity="1"
      d="M0,64L80,58.7C160,53,320,43,480,48C640,53,800,75,960,74.7C1120,75,1280,53,1360,42.7L1440,32L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"
    ></path>
  </svg>
</template>

<script lang="ts" setup>
import * as funcs from "@/functions/funcs";
import { fetchJSONDatas } from "@/functions/funcs";
import { useStore } from "@/store";
import { User } from "@/types/User";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import registerComponent from "../components/registerComponent.vue";
import twoFactorComponent from "../components/twoFactorComponent.vue";

const router = useRouter();
const store = useStore();
let username = ref("");
let password = ref("");
let background_url = "../assets/stars.webm";
let intra_redirection =
  "https://api.intra.42.fr/oauth/authorize?client_id=" + process.env.VUE_APP_42_ID + "&redirect_uri=" + process.env.VUE_APP_42_URI + "&response_type=code";
let token = {
    access_token: null,
    token_type: null,
    expires_in: null,
    scope: null,
    created_at: null,
  },
  login_failed_msg = ref(false);
let codeValidated = ref(false);
let twofaFlag = ref(false);
let displayRegister = ref(false);
// computed: {
//   videoElement() {
//     return this.$refs.video;
//   },
// },
const props = defineProps(["incomingFriendRequest"]);
const emit = defineEmits(["notification", "twofaSuccessClassicUser", "twofaSuccessIntraUser", "update:modelValue"]);

onMounted(async () => {
  let isConnected: boolean = await funcs.isConnected(localStorage.getItem("token") || "").catch((err) => {
    return false;
  });
  if (isConnected) {
    router.push("/game");
  } 

  //get back intra code, if exists
  let code = extractIntraCode();
  if (code != null) {
    await studentLogin(code);
  }
});
function redirectTo(url: string) {
  location.href = url;
}
async function sendCode() {
  await fetchJSONDatas(`api/twofactor/sendCode/${localStorage.getItem("phoneTo2fa")}`, "POST")
    .then((data) => {
    })
    .catch(() => {});
}
async function login() {
  let data = await funcs
    .fetchJSONDatas("api/Authentication/login", "POST", {
      username: username.value,
      password: password.value,
    })
    .catch((err) => {
      return null;
    });
  if (data == null) return;
  login_failed_msg.value = false;
  if (data.user.twoFactorAuth == true && codeValidated.value == false) {
    twofaFlag.value = true;
    localStorage.setItem("phoneTo2fa", data.user.phone);
    localStorage.setItem("userType", "classic");

    sendCode();
    return;
  }
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  funcs
    .trySetupUser()
    .then(() => {
      router.push("/game");
    })
    .catch(() => {});
}

function extractIntraCode(): string | null {
  var url = new URL(window.location.href);
  return url.searchParams.get("code");
}

async function getIntraToken(code: string) {
  const getIntraToken = await fetchJSONDatas(`api/oauth/${code}`, "POST").catch(() => {});
  return getIntraToken;
}

async function getUserAndToken(intraToken: string) {
  const userAndToken = await fetchJSONDatas(`api/oauth/login/${intraToken}`, "POST").catch(() => {});
  return userAndToken;
}

async function studentLogin(code: string) {

  let userAndToken: { user: User; token: string } = {
    user: <User>{},
    token: "",
  };
  try {
    if (code == undefined) code = extractIntraCode() || "";
    if (store.token != undefined && store.user != undefined) {
      userAndToken.user = store.user;
      userAndToken.token = store.token;
    } else {
      let intraToken = await getIntraToken(code);
      userAndToken = await getUserAndToken(intraToken.access_token);
      store.user = userAndToken.user;
      store.token = userAndToken.token;
    }
    if (userAndToken.user.twoFactorAuth == true && codeValidated.value == false) {
      twofaFlag.value = true;
      localStorage.setItem("userType", "intra");
      localStorage.setItem("phoneTo2fa", userAndToken.user.phone!);

      sendCode();
      return;
    }
    login_failed_msg.value = false;
    localStorage.setItem("token", userAndToken.token);
    localStorage.setItem("user", JSON.stringify(userAndToken.user));
  } catch (error) {
  }
  funcs
    .trySetupUser()
    .then(() => {
      router.push("/game");
    })
    .catch(() => {});
}
</script>

<style lang="scss" scoped>
@import url("https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Orbitron:wght@500&family=Press+Start+2P&display=swap");
@import "../styles/variables";
@import "../styles/inputsAndButtons";
@import "../styles/mixins/sizes";
@import "../styles/svgStyles";
@import "../styles/containerStyle.scss";
.twofaComponentDiv {
  display: flex;
  justify-content: center;
  align-items: center;
}
.principalSection {
  margin-top: 6rem;
  @include screen-lg {
    margin: 1rem 0;
  }
}
.mainContainer {
  height: 100%;
  .classicLogin {
    width: 100%;
  }
  .intraLogin {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: center;
  }
  .register {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    margin-top: auto;
    margin-bottom: 15px;
  }
  register-component {
    width: 100%;
  }
  img {
    margin-top: 2rem;
  }
  .sectionDivider {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;

    h4 {
      margin: 0 15px 0 15px;
    }
    .divider {
      margin: 2rem auto;
      border-color: #aa9e7d;
      width: 10rem;
    }
  }
}

.svgSection {
  width: 30%;
  img {
    width: 100%;
  }
  @include screen-lg {
    display: none !important;
  }
}

.footer {
  margin-top: 4rem;
  position: absolute;
  bottom: 0;
  .howToPlay {
    width: 100vw;
    display: flex;
    flex-direction: row;
    justify-content: center;
    font-size: 25px;
    .howToPlaySection {
      color: white;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: 20%;
      .gg-icon {
        --ggs: 1.5;
      }
    }
  }
  h2 {
    text-align: center;
    color: white;
  }

  @include screen-lg {
    display: none !important;
  }
}

// Now every button will have different colors as set above. We get to use the same structure, only changing the custom properties.
button {
  color: var(--color);
  transition: 0.25s;

  &:hover,
  &:focus {
    border-color: var(--hover);
    color: #fff;
  }
}
</style>

function videoElement() { throw new Error("Function not implemented."); }
