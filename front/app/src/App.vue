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
      :key="$route.fullPath"
      @notification="changeNotificationValue"
      :incoming-friend-request="incomingFriendRequest"
    />
    <div v-if="gameConfirmation" class="overlay">
      <GameConfirmation
        @confirmGame="confirmGame()"
        @denyGame="denyGame()"
      ></GameConfirmation>
    </div>
    <div v-if="customInvitation" class="overlay">
      <CustomInvitation
        :inviter="invSender"
        @acceptCustom="acceptCustom()"
        @denyCustom="denyCustom()"
      ></CustomInvitation>
    </div>
    <div v-if="failedInvitation" class="overlay">
      <FailedInvitation @invFailure="invFailure()"></FailedInvitation>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { io } from "socket.io-client";
import config from "./config/config";
import GameConfirmation from "./components/GameConfirmation/Modal.vue";
import CustomInvitation from "./components/CustomInvitation/Modal.vue";
import FailedInvitation from "./components/FailedInvitation/Modal.vue";
import { request } from "http";

// let socket = config.socket;

const route = useRoute();
const router = useRouter();
const incomingFriendRequest = ref("");
const profileNotificationBadge = ref(false);
const gameConfirmation = ref(false);
const customInvitation = ref(false);
const failedInvitation = ref(false);
const invSender = ref("Placeholder");

if (!config.socket.id && localStorage.getItem("user")) {
  console.log("socketing");
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
  //   socket = config.socket;
  //   console.log("?" + socket.id);
}

window.addEventListener("beforeunload", () => {
  // console.log("event recieved");
  // config.socket.emit("disco", {});
  config.socket.disconnect;
  config.socket = io("http://" + window.location.hostname + ":3500", {
    transports: ["websocket"],
    // path: "/api/socket.io/",
    autoConnect: false,
  });
});

window.addEventListener("keydown", (e) => {
  console.log("keydown " + config.socket.id);
  if (e.key === "ArrowLeft")
    config.socket.emit("key", {
      key: "downLeft",
    });
  else if (e.key === "ArrowRight")
    config.socket.emit("key", {
      key: "downRight",
    });
  if (e.key === "a" || e.key === "A")
    config.socket.emit("key", {
      key: "downA",
    });
  else if (e.key === "d" || e.key === "D")
    config.socket.emit("key", {
      key: "downD",
    });
  else if (e.key === " ") {
    config.socket.emit("key", {
      key: "downSpace",
    });
  }
  if (e.key === "o") config.socket.emit("debugging");
  if (e.key === "i") config.socket.emit("chatting");
});

window.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft")
    config.socket.emit("key", {
      key: "upLeft",
    });
  else if (e.key === "ArrowRight")
    config.socket.emit("key", {
      key: "upRight",
    });
  if (e.key === "a")
    config.socket.emit("key", {
      key: "upA",
    });
  else if (e.key === "d")
    config.socket.emit("key", {
      key: "upD",
    });
});

const confirmGame = () => {
  config.socket.emit("playerReady", {}, () => {});
  showConfirmation(false);
  router.push("/game");
};

const denyGame = () => {
  config.socket.emit("playerNotReady");
  showConfirmation(false);
};

const acceptCustom = () => {
  showInvite(false);
  router.push("/game");
  config.socket.emit("settingsInvitee");
};

const denyCustom = () => {
  config.socket.emit("declineCustom");
  showInvite(false);
};

const invFailure = () => {
  showFailure(false);
};

const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  config.socket.emit("disco", {});
  config.socket = io("http://" + window.location.hostname + ":3500", {
    transports: ["websocket"],
    // path: "/api/socket.io/",
    autoConnect: false,
  });
};

const changeNotificationValue = (value: boolean) => {
  profileNotificationBadge.value = value;
};

function showConfirmation(show: boolean) {
  gameConfirmation.value = show;
}

function showInvite(show: boolean) {
  customInvitation.value = show;
}

function showFailure(show: boolean) {
  failedInvitation.value = show;
}

onMounted(() => {
  watch(
    () => route.path,
    (currentValue, oldValue) => {
      if (!config.socket.hasListeners("customInvite")) {
        config.socket.on("customInvite", (inviter: string) => {
          // theRoom = gameRoom;
          showInvite(true);
        });
      }
      if (!config.socket.hasListeners("gameConfirmation")) {
        config.socket.on("gameConfirmation", (gameRoom: any) => {
          // theRoom = gameRoom;
          showConfirmation(true);
        });
      }
      if (!config.socket.hasListeners("invitation")) {
        config.socket.on("invitation", (requester: string) => {
          invSender.value = requester;
          showInvite(true);
        });
      }
      if (!config.socket.hasListeners("gameConfirmationTimeout")) {
        config.socket.on("gameConfirmationTimeout", () => {
          showConfirmation(false);
          // startButton.value = true;
          // lobbyStatus.value = "Find Match";
        });
      }
      if (!config.socket.hasListeners("friendshipInvite")) {
        config.socket.on("friendshipInvite", (requester: string) => {
          incomingFriendRequest.value = requester;
          profileNotificationBadge.value = true;
        });
      }
      if (!config.socket.hasListeners("inviteFailure")) {
        config.socket.on("inviteFailure", () => {
          showFailure(true);
        });
      }
      if (currentValue != "/game") config.socket.emit("watchPath");

      if (
        localStorage.getItem("token") &&
        profileNotificationBadge.value === false
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
            profileNotificationBadge.value = data;
          })
          .catch((err) => {
            console.log(err);
            profileNotificationBadge.value = false;
          });
      }
    }
  );
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
