<template>
  <div>
    <div v-if="$route.path != '/' && $route.path != '/signup'">
      <nav>
        <router-link to="/portal">Portal</router-link> |
        <router-link to="/game">Game</router-link> |
        <router-link to="/profile"
          >Profile
          <div :class="'dot' + (profileNotificationBadge ? ' show' : '')"></div
        ></router-link>
        | <router-link to="/chat">Chat</router-link> |
        <router-link to="/users">All users</router-link> |
        <router-link to="/edit">Profile Editing</router-link> |
        <router-link to="/" v-on:click.prevent="logout()">Logout</router-link>
      </nav>
    </div>
    <router-view
      @notification="changeNotificationValue"
      :incoming-friend-request="incomingFriendRequest"
    />
  </div>
</template>

<script lang="ts">
import { store } from "./store";
import { defineComponent, watch } from "vue";
import { io, Socket } from "socket.io-client";
import config from "./config/config";
if (!config.socket.id && localStorage.getItem("user")) {
  config.socket = io("http://" + window.location.hostname + ":3500", {
    auth: {
      token: localStorage.getItem("token"),
      user: JSON.parse(localStorage.getItem("user") || "{}"),
    },
    transports: ["websocket"],
    autoConnect: false,
  });
  config.socket.connect();
}
export default defineComponent({
  created() {
    window.addEventListener("beforeunload", this.handler);
  },
  data() {
    return {
      isConnected: store.isConnected,
      socket: config.socket,
      incomingFriendRequest: "",
      profileNotificationBadge: false,
    };
  },
  methods: {
    logout() {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      config.socket.emit("disco", {});
      config.socket = io("http://" + window.location.hostname + ":3500", {
        transports: ["websocket"],
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
    changeNotificationValue(value: boolean) {
      this.profileNotificationBadge = value;
    },
    handler: function handler() {
      config.socket.disconnect;
      config.socket = io("http://" + window.location.hostname + ":3500", {
        transports: ["websocket"],
        autoConnect: false,
      });
    },
    mounted() {
      this.socket.on("friendshipInvite", (requester: string) => {
        this.incomingFriendRequest = requester;
        this.profileNotificationBadge = true;
      });
      watch(
        () => this.$route.path,
        () => {
          if (
            localStorage.getItem("token") &&
            this.profileNotificationBadge === false
          ) {
            fetch(
              "http://" +
                window.location.hostname +
                ":3000/api/friendship/has-invitations",
              {
                method: "GET",
                headers: {
                  Authorization: "Bearer " + localStorage.getItem("token"),
                },
              }
            )
              .then((res) => {
                return res.json();
              })
              .then((data) => {
                this.profileNotificationBadge = data;
              })
              .catch((err) => {
                this.profileNotificationBadge = false;
              });
          }
        }
      );
    },
  },
});
</script>

<style lang="scss">
body {
  background-color: #010b12;
  color: #aa9e7d;
}

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
    color: #f0e68c;

    &.router-link-exact-active {
      color: #d2691e;
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

.dot {
  display: none;
  width: 10px;
  height: 10px;
  background: #e7d899;
  border-radius: 50%;
  animation: beat 2000ms infinite;
  opacity: 60%;
  box-shadow: 0 0 0 2px rgba(200, 150, 100, 1), 0 0 0 3px #e7d899;
  margin-bottom: 3px;

  &.show {
    display: inline-block;
  }
}

@keyframes beat {
  0% {
    box-shadow: 0 0 0 0px rgba(200, 150, 100, 1), 0 0 0 1px #e7d899;
  }
  50% {
    box-shadow: 0 0 2px 3px rgba(140, 110, 80, 1), 0 0 0 4px #e7d899;
    opacity: 100%;
  }
  100% {
    box-shadow: 0 0 0 0px rgba(200, 150, 100, 1), 0 0 0 1px #e7d899;
  }
}
</style>
