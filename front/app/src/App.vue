<template>
  <div>
    <div v-if="$route.path != '/' && $route.path != '/signup'">
      <nav>
        <!-- <router-link to="/signin">Sign in</router-link> |
			  <router-link to="/signup">Sign up</router-link> -->
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
console.log(config.socket.id);
if (!config.socket.id && localStorage.getItem("user")) {
  console.log(config.socket);
  config.socket = io("http://" + window.location.hostname + ":3500", {
    auth: {
      token: localStorage.getItem("token"),
      user: JSON.parse(localStorage.getItem("user") || "{}"),
    },
    // path: "/api/socket.io/",
    transports: ["websocket"],
    autoConnect: false,
  });
  config.socket.connect();
  console.log(config.socket.id);
}
export default defineComponent({
  created() {
    window.addEventListener("beforeunload", this.handler);
  },
  data() {
    return {
      isConnected: store.isConnected,
    };
  },
  methods: {
    logout() {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      config.socket.emit("disco", {});
      config.socket = io("http://" + window.location.hostname + ":3500", {
        transports: ["websocket"],
        // path: "/api/socket.io/",
        autoConnect: false,
      });
    },
    openModal() {
      document.querySelector(".modal")?.classList.remove("hidden");
      document.querySelector(".overlay")?.classList.remove("hidden");
    },
    closeModal() {
      document.querySelector(".modal")?.classList.add("hidden");
      document.querySelector(".overlay")?.classList.add("hidden");
    },
    handler: function handler() {
      // console.log("event recieved");
      // config.socket.emit("disco", {});
      config.socket.disconnect;
      config.socket = io("http://" + window.location.hostname + ":3500", {
        transports: ["websocket"],
        // path: "/api/socket.io/",
        autoConnect: false,
      });
    },
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
