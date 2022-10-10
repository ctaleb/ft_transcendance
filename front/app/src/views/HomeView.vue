<template>
  <div>
    <h2 style="text-align: center">
      Welcome on fc_transcendance, please Log in
    </h2>
    <form @submit.prevent="login" style="margin-bottom: 2em">
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
    <a
      style="
        background-color: #e7e7e7;
        color: black;
        border: 3px solid black;
        margin-top: 1em;
      "
      v-bind:href="intra_redirection"
    >
      Continue with 42
    </a>
    <h3 style="text-align: center; margin-top: 2em">
      Or <a href="/signup">sign up</a>
    </h3>
  </div>
  <!--   <div :style="{ color: login_failed_color }" v-if="login_failed_msg"> -->
  <div class="text-red" v-if="login_failed_msg">
    Login failed. Please try again.
  </div>
</template>

<script lang="ts">
import { processExpression } from "@vue/compiler-core";
import { defineComponent } from "vue";
import { ref } from "vue";
import { io, Socket } from "socket.io-client";
import config from "../config/config";

let funcs = require("../functions/funcs");
export default defineComponent({
  data: () => {
    return {
      username: "",
      password: "",
      intra_redirection:
        "https://api.intra.42.fr/oauth/authorize?client_id=" +
        process.env.VUE_APP_42_ID +
        "&redirect_uri=http%3A%2F%210.1.7.1%3A4000%2F&response_type=code",
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
      fetch("http://" + window.location.hostname + ":3000/api/oauth/" + code, {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      })
        .then((res) => {
          return res.json();
        })
        .then((token) => {
          fetch(
            "http://" +
              window.location.hostname +
              ":3000/api/oauth/login/" +
              token.access_token,
            {
              method: "POST",
            }
          )
            .then((response) => {
              return response.json();
            })
            .then((value: any) => {
              localStorage.setItem("token", value.token);
              localStorage.setItem("user", JSON.stringify(value.user));

              config.socket = io(
                "http://" + window.location.hostname + ":3000",
                {
                  auth: { token: value.token, user: value.user },
                }
              );
              this.$router.push("/portal");
            })
            .catch((err) => console.log(err));
        })
        .catch((err) => console.log(err));
    }
  },
  methods: {
    async login() {
      fetch(
        "http://" + window.location.hostname + ":3000/api/Authentication/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: this.username,
            password: this.password,
          }),
        }
      )
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
          setTimeout(() => {}, 2000);

          config.socket = io("http://" + window.location.hostname + ":3000", {
            auth: { token: value.token, user: value.user },
          });
          this.$router.push("/portal");
        })
        .catch((error) => {
          console.log(error);
        });
    },
  },
});
</script>
