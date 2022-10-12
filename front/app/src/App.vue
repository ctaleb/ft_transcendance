<template>
  <div>
    <div v-if="$route.path != '/' && $route.path != '/signup'">
      <nav>
        <router-link to="/portal">Portal</router-link> |
        <router-link to="/game">Game</router-link> |
        <router-link to="/profile">Profile</router-link> |
        <router-link to="/chat">Chat</router-link> |
        <router-link to="/users">All users</router-link> |
        <router-link to="/edit">Profile Editing</router-link> |
        <router-link to="/" v-on:click.prevent="logout()">Logout</router-link>
      </nav>
    </div>
    <router-view />
  </div>
</template>

<script lang="ts">
import { store } from "./store";
import { defineComponent } from "vue";
import { io, Socket } from "socket.io-client";
import config from "./config/config";

if (!config.socket.id && localStorage.getItem("user")) {
  config.socket = io("http://" + window.location.hostname + ":3000", {
    auth: {
      token: localStorage.getItem("token"),
      user: JSON.parse(localStorage.getItem("user") || "{}"),
    },
  });
}

export default defineComponent({
  data() {
    return {
      isConnected: store.isConnected,
      socket: config.socket,
    };
  },
  methods: {
    logout() {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      config.socket.emit("disco", {});
    },
    openModal() {
      document.querySelector(".modal")?.classList.remove("hidden");
      document.querySelector(".overlay")?.classList.remove("hidden");
    },
    closeModal() {
      document.querySelector(".modal")?.classList.add("hidden");
      document.querySelector(".overlay")?.classList.add("hidden");
    },
  },
  mounted() {
    this.socket.on("friendshipInvite", () => {
      console.log("friendshipInvite Recieved");
    });
  },
});
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}

.text-red {
  color: red;
}

.hidden {
  display: none;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(3px);
  z-index: 5;
}
</style>
