<template>
  <div>
    <div
      style="text-align: center"
      v-if="$route.path != '/' && $route.path != '/signup'"
    >
      <nav>
        <router-link to="/profile"
          >Profile
          <div :class="'dot' + (profileNotificationBadge ? ' show' : '')"></div
        ></router-link>
        | <router-link to="/game">Game</router-link> |
        <router-link to="/chat">Chat</router-link>
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
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router";
import { getUserByNickname, trySetupUser } from "@/functions/funcs";
import { User } from "@/types/GameSummary";
import { useStore } from "@/store";
import GameConfirmation from "./components/GameConfirmation/Modal.vue";
import CustomInvitation from "./components/CustomInvitation/Modal.vue";
import FailedInvitation from "./components/FailedInvitation/Modal.vue";

const store = useStore();
let socket = store.socket;

const route = useRoute();
const router = useRouter();
const incomingFriendRequest = ref("");
const profileNotificationBadge = ref(false);
const gameConfirmation = ref(false);
const customInvitation = ref(false);
const failedInvitation = ref(false);
const invSender = ref("Placeholder");

store.$subscribe((mutation, state) => {
  socket = state.socket;
});

trySetupUser().catch((err) => {
  console.log("Cant't set up user for now");
});

//window.addEventListener("beforeunload", () => {
//  socket?.disconnect;
//});

window.addEventListener("keydown", (e) => {
  console.log("keydown " + socket?.id);
  if (e.key === "ArrowLeft")
    socket?.emit("key", {
      key: "downLeft",
    });
  else if (e.key === "ArrowRight")
    socket?.emit("key", {
      key: "downRight",
    });
  if (e.key === "a" || e.key === "A")
    socket?.emit("key", {
      key: "downA",
    });
  else if (e.key === "d" || e.key === "D")
    socket?.emit("key", {
      key: "downD",
    });
  else if (e.key === " ") {
    socket?.emit("key", {
      key: "downSpace",
    });
  }
  if (e.key === "o") socket?.emit("debugging");
  if (e.key === "i") socket?.emit("chatting");
});

window.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft")
    socket?.emit("key", {
      key: "upLeft",
    });
  else if (e.key === "ArrowRight")
    socket?.emit("key", {
      key: "upRight",
    });
  if (e.key === "a")
    socket?.emit("key", {
      key: "upA",
    });
  else if (e.key === "d")
    socket?.emit("key", {
      key: "upD",
    });
});

const confirmGame = () => {
  socket?.emit("playerReady", {}, () => {});
  showConfirmation(false);
  router.push("/game");
};

const denyGame = () => {
  socket?.emit("playerNotReady");
  showConfirmation(false);
};

const acceptCustom = () => {
  showInvite(false);
  router.push("/game");
  socket?.emit("settingsInvitee");
};

const denyCustom = () => {
  socket?.emit("declineCustom");
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

  socket?.emit("disco", {});
  //  socket? = io("http://" + window.location.hostname + ":3500", {
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
      if (!socket?.hasListeners("customInvite")) {
        socket?.on("customInvite", (inviter: string) => {
          // theRoom = gameRoom;
          showInvite(true);
        });
      }
      if (!socket?.hasListeners("gameConfirmation")) {
        socket?.on("gameConfirmation", (gameRoom: any) => {
          // theRoom = gameRoom;
          showConfirmation(true);
        });
      }
      if (!socket?.hasListeners("invitation")) {
        socket?.on("invitation", (requester: string) => {
          invSender.value = requester;
          showInvite(true);
        });
      }
      if (!socket?.hasListeners("gameConfirmationTimeout")) {
        socket?.on("gameConfirmationTimeout", () => {
          showConfirmation(false);
          // startButton.value = true;
          // lobbyStatus.value = "Find Match";
        });
      }
      if (!socket?.hasListeners("friendshipInvite")) {
        socket?.on("friendshipInvite", (requester: User) => {
          incomingFriendRequest.value = requester.nickname;
          profileNotificationBadge.value = true;
          getUserByNickname(requester.nickname)
            .then((data) => {
              store.invitations?.push(data!);
            })
            .catch((err) => {
              console.log(err);
            });
        });
      }
      if (!socket?.hasListeners("acceptInvite")) {
        socket?.on("acceptInvite", (requester: User) => {
          getUserByNickname(requester.nickname)
            .then((data) => {
              store.user?.friends?.push(data!);
            })
            .catch((err) => {
              console.log(err);
            });
        });
      }
      if (!socket?.hasListeners("removeFriend")) {
        socket?.on("removeFriend", (requester: User) => {
          getUserByNickname(requester.nickname)
            .then((data) => {
              store.user?.friends?.splice(
                store.user?.friends?.indexOf(data!),
                1
              );
            })
            .catch((err) => {
              console.log(err);
            });
        });
      }
      if (!socket?.hasListeners("inviteFailure")) {
        socket?.on("inviteFailure", () => {
          showFailure(true);
        });
      }
      if (currentValue != "/game") socket?.emit("watchPath");

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
@import "styles/custom.scss";

body {
  background-color: #010b12;
  color: #aa9e7d;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

nav {
  padding: 30px;
  height: 10vh;

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
