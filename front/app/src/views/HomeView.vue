<template>
  <div id="backgroundVideo">
    <video class="video" ref="video" autoplay loop muted>
      <source src="../assets/stars.webm" type="video/mp4" />
    </video>
  </div>
  <div v-if="twofaFlag == false" class="main_container">
    <img
      src="https://findicons.com/files/icons/1275/naruto_vol_1/256/uzumaki_naruto.png"
      width="80"
      height="80"
      alt=""
    />
    <h1 class="main_title">
      <marquee
        direction="right"
        behavior="alternate"
        style="border-left: #aa9e7d 4px SOLID; border-right: #aa9e7d 4px SOLID"
      >
        SUP3RP0NG
      </marquee>
    </h1>
    <form @submit.prevent="login" style="margin-bottom: 2em">
      <input
        class="input"
        placeholder="Username"
        v-model="username"
        type="text"
        id="username"
        name="username"
        required
      /><br /><br />
      <input
        class="input"
        placeholder="Password"
        v-model="password"
        type="password"
        id="password"
        name="password"
        required
      /><br /><br />
      <button
        type="submit"
        value="Connexion"
        class="button classic_login_btn pulse"
      >
        Connexion
      </button>
    </form>
    <hr class="solid divider" />
    <a class="button pulse" v-bind:href="intra_redirection">
      Continue with 42
    </a>
    <ButtonComponent :link="intra_redirection" />
    <a id="signup_link" href="/signup">New account</a>
  </div>
  <!--   <div :style="{ color: login_failed_color }" v-if="login_failed_msg"> -->
  <div class="text-red" v-if="login_failed_msg">
    Login failed. Please try again.
  </div>
  <div class="twofaComponentDiv">
    <two-factor-component
      v-if="twofaFlag == true"
      class="twoFactorComponent"
      v-model="codeValidated"
      @twofaSuccessClassicUser="login"
      @twofaSuccessIntraUser="studentLogin"
    />
  </div>
</template>

<script lang="ts" setup>
import * as funcs from "@/functions/funcs";
import { useStore } from "@/store";
import { User } from "@/types/User";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import twoFactorComponent from "../components/twoFactorComponent.vue";

const router = useRouter();
const store = useStore();
let username = ref("");
let password = ref("");
let background_url = "../assets/stars.webm";
let intra_redirection =
  "https://api.intra.42.fr/oauth/authorize?client_id=" +
  process.env.VUE_APP_42_ID +
  "&redirect_uri=" +
  process.env.VUE_APP_42_URI +
  "&response_type=code";
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
const emit = defineEmits([
  "notification",
  "twofaSuccessClassicUser",
  "twofaSuccessIntraUser",
  "update:modelValue",
]);

onMounted(async () => {
  let isConnected: boolean = await funcs
    .isConnected(localStorage.getItem("token") || "")
    .catch((err) => {
      console.log(err);
      return false;
    });
  if (isConnected) {
    router.push("/game");
  } else console.log("not connected");

  //get back intra code, if exists
  let code = extractIntraCode();
  if (code != null) {
    studentLogin(code);
  }
});

async function login() {
  console.log("CODEVALIDATED --> " + codeValidated.value);
  let response = await fetch(
    "http://" + window.location.hostname + ":3000/api/Authentication/login",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username.value,
        password: password.value,
      }),
    }
  );
  if (response.status != 201) {
    login_failed_msg.value = true;
    throw response.status;
  }

  let data = await response.json();
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
  let getIntraToken = await fetch(
    "http://" + window.location.hostname + ":3000/api/oauth/" + code,
    {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    }
  );
  return await getIntraToken.json();
}

async function getUserAndToken(intraToken: string) {
  const userAndToken = await fetch(
    "http://" +
      window.location.hostname +
      ":3000/api/oauth/login/" +
      intraToken,
    {
      method: "POST",
    }
  );
  return await userAndToken.json();
}

async function studentLogin(code: string) {
  console.log("stuent login");
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
    if (
      userAndToken.user.twoFactorAuth == true &&
      codeValidated.value == false
    ) {
      twofaFlag.value = true;
      localStorage.setItem("userType", "intra");
      localStorage.setItem("phoneTo2fa", userAndToken.user.phone);

      //  sendCode();
      return;
    }
    localStorage.setItem("token", userAndToken.token);
    localStorage.setItem("user", JSON.stringify(userAndToken.user));
  } catch (error) {
    console.log(error);
    console.log("Can't login the student");
  }
  funcs.trySetupUser().then(() => {
    router.push("/game");
  });

  async function sendCode() {
    await fetch(
      "http://" +
        window.location.hostname +
        ":3000/api/twofactor/sendCode/" +
        localStorage.getItem("phoneTo2fa"),
      {
        method: "POST",
      }
    )
      .then((data) => data.json())
      .then((data) => {
        console.log(data.status);
        //error in the console(unexpected json input) because i don't return jsons format in the service and the controller. Need to add return before the send function, and make a json return int eh last then
      })
      .catch((err) => {
        console.log(err);
      });
  }
}
</script>

<style lang="scss" scoped>
@import url("https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Orbitron:wght@500&family=Press+Start+2P&display=swap");

.twofaComponentDiv {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

#backgroundVideo {
  position: fixed;
  right: 0;
  bottom: 0;
  min-width: 100%;
  min-height: 100%;
  z-index: -1;
}

.main_title {
  //  font-family: "Press Start 2P", cursive;
  font-family: "Orbitron", sans-serif;
  margin: 1rem auto;
  width: 20rem;
}
.button {
  position: relative;
  height: auto;
  padding: 5px;
  color: #aa9e7d;
  border: 3px solid;
  border-image-slice: 1;
  border-image-source: linear-gradient(to bottom, #c1a36b, #635e4f);
  background: linear-gradient(to bottom right, #191e2a, #182121);
}

.main_container {
  //  https://i.gifer.com/QgxJ.gif
  background-image: url("https://cdna.artstation.com/p/assets/images/images/015/582/594/4k/artur-sadlos-leg-never-sh270-background-as-v001.jpg?1548866512&dl=1");
  background-size: cover;
  border: 2px solid;
  border-image-slice: 1;
  border-image-source: linear-gradient(to bottom, #c1a36b, #635e4f);
  border-radius: 10px;
  box-shadow: 5px 5px 5px #5c5b58;
  color: #aa9e7d;
  margin: 20rem auto;
  width: 60rem;
  text-align: center;
}
.input {
  padding: 8px;
  border-radius: 60px;
  border: solid 3px #aa9e7d;
  border-radius: 10px;
  width: 12rem;
}
#signup_link {
  color: white;
  display: block;
  margin-top: 2rem;
  margin-bottom: 3rem;
  font-size: 20px;
  text-decoration: underline;
}
.classic_login_btn {
  width: 12rem;
  margin-left: 0;
}
.divider {
  margin: 2rem auto;
  border-color: #aa9e7d;
  width: 12rem;
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
