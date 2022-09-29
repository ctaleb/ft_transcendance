<template>
  <div>
    <h2 style="text-align: center">
      Welcome on fc_transcendance, please Log in
    </h2>
    <form @submit.prevent="login">
      <label for="username">Username: </label>
      <input
        v-model="username"
        type="text"
        id="username"
        name="username"
        required
      /><br /><br />
      <label for="password">Password: </label>
      <input
        v-model="password"
        type="password"
        id="password"
        name="password"
        required
      /><br /><br />
      <input type="submit" value="Submit" />
    </form>
    <button
      style="
        background-color: #e7e7e7;
        color: black;
        width: 7em;
        border: 3px solid black;
        margin-top: 1em;
        padding: 0.5em;
      "
      type="button"
      onclick="location.href='https://api.intra.42.fr/oauth/authorize?client_id=1a90768d9956eae0b0360b4588273a1d4a25143a9c8cfc6a0330dac17b9684db&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2F&response_type=code'"
    >
      Continue with 42
    </button>
    <h3 style="text-align: center; margin-top: 0">
      Or <a href="/signup">sign up</a>
    </h3>
  </div>
  <!--   <div :style="{ color: login_failed_color }" v-if="login_failed_msg"> -->
  <div class="text-red" v-if="login_failed_msg">
    Login failed. Please try again.
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { ref } from "vue";

let funcs = require("../functions/funcs");

export default defineComponent({
  data: () => {
    return {
      username: "",
      password: "",
      token: {
        access_token: null,
        token_type: null,
        expires_in: null,
        scope: null,
        created_at: null,
      },
      login_failed_msg: ref(false),
    };
  },
  mounted() {
    let isConnected = funcs.isConnected(localStorage.getItem("token"));
    if (isConnected) this.$router.push("/portal");
    else console.log("not connected");

    //get back intra code, if exists
    let current_url = window.location.href;
    var url = new URL(current_url);
    let code = url.searchParams.get("code");
    if (code != null) {
      fetch("http://localhost:3000/api/oauth/" + code, {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      })
        .then((res) => {
          return res.json();
        })
        .then((token) => {
          fetch("http://localhost:3000/api/oauth/login/" + token.access_token, {
            method: "POST",
          })
            .then((response) => {
              return response.json();
            })
            .then((value: any) => {
              localStorage.setItem("token", value.token);
              localStorage.setItem("user", JSON.stringify(value.user));
              this.$router.push("/portal");
            })
            .catch((err) => console.log(err));
        })
        .catch((err) => console.log(err));
    }
  },
  methods: {
    async login() {
      fetch("http://localhost:3000/api/Authentication/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: this.username,
          password: this.password,
        }),
      })
        .then((response) => {
          if (response.status != 201) {
            this.login_failed_msg = true;
            throw response.status;
          }
          return response.json();
        })
        .then((value: any) => {
          localStorage.setItem("token", value.token);
          localStorage.setItem("user", JSON.stringify(value.user));
          this.$router.push("/portal");
        })
        .catch((error) => {
          console.log(error);
        });
    },
  },
});
</script>
