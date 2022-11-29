<template>
  <!--<svg preserveAspectRatio="none" class="topSvg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
    <path
	fill="#C1A36B"
	fill-opacity="1"
	d="M0,288L24,277.3C48,267,96,245,144,202.7C192,160,240,96,288,101.3C336,107,384,181,432,181.3C480,181,528,107,576,90.7C624,75,672,117,720,144C768,171,816,181,864,154.7C912,128,960,64,1008,74.7C1056,85,1104,171,1152,208C1200,245,1248,235,1296,240C1344,245,1392,267,1416,277.3L1440,288L1440,0L1416,0C1392,0,1344,0,1296,0C1248,0,1200,0,1152,0C1104,0,1056,0,1008,0C960,0,912,0,864,0C816,0,768,0,720,0C672,0,624,0,576,0C528,0,480,0,432,0C384,0,336,0,288,0C240,0,192,0,144,0C96,0,48,0,24,0L0,0Z"
    ></path>
</svg>-->
  <div class="principalSection">
    <div class="main_container">
      <img src="../assets/logo.gif" width="270" height="270" alt="" />
      <div class="twofaComponentDiv" v-if="twofaFlag == true">
        <two-factor-component
          v-if="twofaFlag == true"
          class="twoFactorComponent"
          v-model="codeValidated"
          @twofaSuccessClassicUser="login"
          @twofaSuccessIntraUser="studentLogin"
        />
      </div>
      <div v-if="twofaFlag == false" style="width: 100%">
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
          <a class="button pulse" v-bind:href="intra_redirection"> Continue with 42 </a>
        </div>
      </div>
      <div class="register" v-if="twofaFlag == false">
        <p>Don't have an account yet ?</p>
        <a href="/signup" class="button pulse">New account</a>
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
import { useStore } from "@/store";
import { User } from "@/types/User";
import { log } from "console";
import { storeToRefs } from "pinia";
import { hasUncaughtExceptionCaptureCallback } from "process";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
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
// computed: {
//   videoElement() {
//     return this.$refs.video;
//   },
// },
const props = defineProps(["incomingFriendRequest"]);
const emit = defineEmits(["notification", "twofaSuccessClassicUser", "twofaSuccessIntraUser", "update:modelValue"]);

onMounted(async () => {
  let isConnected: boolean = await funcs.isConnected(localStorage.getItem("token") || "").catch((err) => {
    console.log(err);
    return false;
  });
  if (isConnected) {
    router.push("/game");
  } else console.log("not connected");

  //get back intra code, if exists
  let code = extractIntraCode();
  if (code != null) {
    await studentLogin(code);
  }
});

async function sendCode() {
  await fetch("http://" + window.location.hostname + ":3000/api/twofactor/sendCode/" + localStorage.getItem("phoneTo2fa"), {
    method: "POST",
  })
    .then((data) => data.json())
    .then((data) => {
      console.log(data.status);
      //error in the console(unexpected json input) because i don't return jsons format in the service and the controller. Need to add return before the send function, and make a json return int eh last then
    })
    .catch((err) => {
      console.log(err);
    });
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

    //sendCode();
    return;
  }
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  funcs.trySetupUser().then(() => {
    router.push("/game");
  });
}

function extractIntraCode(): string | null {
  var url = new URL(window.location.href);
  return url.searchParams.get("code");
}

async function getIntraToken(code: string) {
  let getIntraToken = await fetch("http://" + window.location.hostname + ":3000/api/oauth/" + code, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  return await getIntraToken.json();
}

async function getUserAndToken(intraToken: string) {
  const userAndToken = await fetch("http://" + window.location.hostname + ":3000/api/oauth/login/" + intraToken, {
    method: "POST",
  });
  return await userAndToken.json();
}

async function studentLogin(code: string) {
  console.log("student login");

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

      //  sendCode();
      return;
    }
    login_failed_msg.value = false;
    localStorage.setItem("token", userAndToken.token);
    localStorage.setItem("user", JSON.stringify(userAndToken.user));
  } catch (error) {
    console.log(error);
    console.log("Can't login the student");
  }
  funcs.trySetupUser().then(() => {
    router.push("/game");
  });
}
</script>

<style lang="scss" scoped>
@import url("https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Orbitron:wght@500&family=Press+Start+2P&display=swap");
@import "../styles/variables";
@import "../styles/mixins/sizes";
.bottomSvg {
  position: absolute;
  bottom: 0;
  z-index: -5;
  height: 39vh;
  width: 100vw;
  path {
    width: 100%;
  }
}
.twofaComponentDiv {
  display: flex;
  justify-content: center;
  align-items: center;
}
.principalSection {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  width: 100vw;
  height: 75vh;
  .main_container {
    margin-top: 5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-around;
    z-index: 11;
    background: rgb(47, 42, 44);
    background: linear-gradient(165deg, rgba(47, 42, 44, 1) 50%, rgba(31, 31, 24, 1) 100%);
    border: 2px solid;
    border-image-slice: 1;
    box-shadow: 5px 5px 5px #5c5b58;
    border-radius: 10px;
    color: #aa9e7d;
    width: 30%;
    height: 65vh;
    text-align: center;

    .classicLogin {
      width: 100%;
      input {
        color: white;
        font-size: 20px;
        padding: 15px;
        width: 60%;
        border-bottom: $primary;
        background: #2f2a2c;
        border: none;
        border-bottom: solid 2px $primary;
      }
      input:focus {
        outline: none;
      }
    }
    .intraLogin {
      width: 100%;
      display: flex;
      flex-direction: row;
      justify-content: center;
      a {
        display: block;
        text-decoration: none;
        color: $primary;
      }
    }
    .register {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      a {
        display: block;
        text-decoration: none;
        color: $primary;
      }
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
    .button {
      width: 60%;
      padding: 10px;
      background: transparent;
      border: 1px solid $primary;
      cursor: pointer;
    }
    .button:hover {
      background: $primary;
      color: white;
    }
  }
}
.svgSection {
  width: 30%;
  img {
    width: 100%;
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
}

#signup_link {
  color: white;
  display: block;
  margin-top: 2rem;
  margin-bottom: 3rem;
  font-size: 20px;
  text-decoration: underline;
}

// Animate the size, outside
.pulse:hover,
.pulse:focus {
  animation: pulse 1s;
  box-shadow: 0 0 0 0.5em transparent;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 var(--hover);
  }
}
$colors: (
  pulse: #aa9e7d,
);

// Sass variables compile to a static string; CSS variables are dynamic and inherited
// Loop through the map and set CSS custom properties using Sass variables
@each $button, $color in $colors {
  .#{$button} {
    --color: #{$color};
    --hover: #{adjust-hue($color, 45deg)};
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
