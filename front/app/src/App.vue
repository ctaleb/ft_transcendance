<template>
  <div>
    <nav class="navbar">
      <div style="display: flex; position: relative; justify-content: center" v-if="$route.path != '/' && $route.path != '/signup'">
        <router-link to="/profile"
          >Profile
          <div :class="'dot' + (profileNotificationBadge ? ' show' : '')"></div
        ></router-link>
        |<router-link to="/game"> PLAY </router-link>|
        <router-link to="/chat">Chat</router-link>
      </div>
    </nav>
    <router-view :key="$route.fullPath" @notification="changeNotificationValue" :incoming-friend-request="incomingFriendRequest" />
    <div v-if="gameConfirmation" class="overlay">
      <GameConfirmation @confirmGame="confirmGame()" @denyGame="denyGame()"></GameConfirmation>
    </div>
    <div v-if="customInvitation" class="overlay">
      <CustomInvitation :inviter="invSender" @acceptCustom="acceptCustom()" @denyCustom="denyCustom()"></CustomInvitation>
    </div>
    <div v-if="failedInvitation" class="overlay">
      <FailedInvitation @invFailure="invFailure()"></FailedInvitation>
    </div>
    <div class="alertFlex">
      <AlertCard v-for="message of alertMessages" :message="message" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router";
import { User, getUserByNickname } from "@/types/User";
import { trySetupUser } from "@/functions/funcs";
import { Alert } from "@/types/GameSummary";
import { useStore } from "@/store";
import GameConfirmation from "./components/GameConfirmation/Modal.vue";
import AlertCard from "./components/AlertCard.vue";
import CustomInvitation from "./components/CustomInvitation/Modal.vue";
import FailedInvitation from "./components/FailedInvitation/Modal.vue";
import { updateStatus } from "@/functions/funcs";

const store = useStore();
const route = useRoute();
const router = useRouter();
const incomingFriendRequest = ref("");
const profileNotificationBadge = ref(false);
const gameConfirmation = ref(false);
const customInvitation = ref(false);
const failedInvitation = ref(false);
const invSender = ref("Placeholder");

trySetupUser().catch((err) => {
  console.log("Cant't set up user for now");
});

let socket = store.socket;
let alertMessages: Alert[] = store.message;

store.$subscribe((mutation, state) => {
  if (!state.socket?.hasListeners("updateOneUserStatus")) {
    state.socket?.on("updateOneUserStatus", (info: any) => {
      updateStatus(info.id, info.status);
    });
  }
  if (!state.socket?.hasListeners("customInvite")) {
    state.socket?.on("customInvite", (inviter: string) => {
      // theRoom = gameRoom;
      showInvite(true);
    });
  }
  if (!state.socket?.hasListeners("gameConfirmation")) {
    state.socket?.on("gameConfirmation", (gameRoom: any) => {
      // theRoom = gameRoom;
      showConfirmation(true);
    });
  }
  if (!state.socket?.hasListeners("invitation")) {
    state.socket?.on("invitation", (requester: string) => {
      invSender.value = requester;
      showInvite(true);
    });
  }
  if (!state.socket?.hasListeners("gameConfirmationTimeout")) {
    state.socket?.on("gameConfirmationTimeout", () => {
      showConfirmation(false);
      // startButton.value = true;
      // lobbyStatus.value = "Find Match";
    });
  }
  if (!state.socket?.hasListeners("friendshipInvite")) {
    state.socket?.on("friendshipInvite", (requester: User) => {
      incomingFriendRequest.value = requester.nickname;
      profileNotificationBadge.value = true;
      getUserByNickname(requester.nickname).then((data) => {
        state.user?.invitations?.push(data!);
      });
    });
  }
  if (!state.socket?.hasListeners("acceptInvite")) {
    state.socket?.on("acceptInvite", (requester: User) => {
      getUserByNickname(requester.nickname).then((data) => {
        state.user?.friends?.push(data!);
      });
    });
  }
  if (!state.socket?.hasListeners("removeFriend")) {
    state.socket?.on("removeFriend", (requester: User) => {
      getUserByNickname(requester.nickname).then((data) => {
        state.user?.friends?.splice(state.user?.friends?.indexOf(data!), 1);
      });
    });
  }
  if (!state.socket?.hasListeners("inviteFailure")) {
    state.socket?.on("inviteFailure", () => {
      showFailure(true);
    });
  }
});

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft")
    store.socket?.emit("key", {
      key: "downLeft",
    });
  else if (e.key === "ArrowRight")
    store.socket?.emit("key", {
      key: "downRight",
    });
  if (e.key === "a" || e.key === "A")
    store.socket?.emit("key", {
      key: "downA",
    });
  else if (e.key === "d" || e.key === "D")
    store.socket?.emit("key", {
      key: "downD",
    });
  else if (e.key === " ") {
    store.socket?.emit("key", {
      key: "downSpace",
    });
  }
  if (e.key === "o") store.socket?.emit("debugging");
  if (e.key === "i") store.socket?.emit("chatting");
});

window.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft")
    store.socket?.emit("key", {
      key: "upLeft",
    });
  else if (e.key === "ArrowRight")
    store.socket?.emit("key", {
      key: "upRight",
    });
  if (e.key === "a")
    store.socket?.emit("key", {
      key: "upA",
    });
  else if (e.key === "d")
    store.socket?.emit("key", {
      key: "upD",
    });
});

const confirmGame = () => {
  store.socket?.emit("playerReady", {}, () => {});
  showConfirmation(false);
  router.push("/game");
};

const denyGame = () => {
  store.socket?.emit("playerNotReady");
  showConfirmation(false);
};

const acceptCustom = () => {
  showInvite(false);
  router.push("/game");
  store.socket?.emit("settingsInvitee");
};

const denyCustom = () => {
  store.socket?.emit("declineCustom");
  showInvite(false);
};

const invFailure = () => {
  showFailure(false);
};

const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  store.$reset();
  // map through that list and use the **$reset** fn to reset the state
  //  socket? = io("http://" + window.location.hostname + ":3500", {
  store.socket?.emit("disco", {});
  //  store.socket? = io("http://" + window.location.hostname + ":3500", {
  //    transports: ["websocket"],
  //    // path: "/api/socket.io/",
  //    autoConnect: false,
  //  });
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
      if (currentValue != "/game") store.socket?.emit("watchPath");

      if (localStorage.getItem("token") && profileNotificationBadge.value === false) {
        fetch("http://" + window.location.hostname + ":3000/api/friendship/has-invitations", {
          method: "GET",
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
        })
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
@import "styles/custom.scss";

body {
  background-color: #010b12;
  color: #aa9e7d;
  margin: 0;
  padding: 0;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

.navbar {
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
  display: none !important;
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
