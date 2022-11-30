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
import { addAlertMessage, trySetupUser } from "@/functions/funcs";
import { socketLocal, useStore } from "@/store";
import { isChannel } from "@/types/Channel";
import { Conversation } from "@/types/Conversation";
import { Alert } from "@/types/GameSummary";
import { Message } from "@/types/Message";
import { getUserByNickname, User } from "@/types/User";
import { onMounted, ref, watch } from "vue";
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router";
import AlertCard from "./components/AlertCard.vue";
import CustomInvitation from "./components/CustomInvitation/Modal.vue";
import FailedInvitation from "./components/FailedInvitation/Modal.vue";
import GameConfirmation from "./components/GameConfirmation/Modal.vue";

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

let socket = socketLocal;
let alertMessages: Alert[] = store.message;

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft")
    socket?.value?.emit("key", {
      key: "downLeft",
    });
  else if (e.key === "ArrowRight")
    socket?.value?.emit("key", {
      key: "downRight",
    });
  if (e.key === "a" || e.key === "A")
    socket?.value?.emit("key", {
      key: "downA",
    });
  else if (e.key === "d" || e.key === "D")
    socket?.value?.emit("key", {
      key: "downD",
    });
  else if (e.key === " ") {
    socket?.value?.emit("key", {
      key: "downSpace",
    });
  }
  if (e.key === "o") socket?.value?.emit("debugging");
  if (e.key === "i") socket?.value?.emit("chatting");
});

window.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft")
    socket?.value?.emit("key", {
      key: "upLeft",
    });
  else if (e.key === "ArrowRight")
    socket?.value?.emit("key", {
      key: "upRight",
    });
  if (e.key === "a")
    socket?.value?.emit("key", {
      key: "upA",
    });
  else if (e.key === "d")
    socket?.value?.emit("key", {
      key: "upD",
    });
});

const confirmGame = () => {
  socket?.value?.emit("playerReady", {}, () => {});
  showConfirmation(false);
  router.push("/game");
};

const denyGame = () => {
  socket?.value?.emit("playerNotReady");
  showConfirmation(false);
};

const acceptCustom = () => {
  showInvite(false);
  router.push("/game");
  socket?.value?.emit("settingsInvitee");
};

const denyCustom = () => {
  socket?.value?.emit("declineCustom");
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
  socketLocal.value?.emit("disco", {});
  //  socket?.value? = io("http://" + window.location.hostname + ":3500", {
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
      if (currentValue != "/game") socket?.value?.emit("watchPath");
      store.$patch({
        currentChat: undefined,
      });

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
  watch(
    () => socketLocal.value,
    (currentValue, oldValue) => {
      if (!socket.value?.hasListeners("customInvite")) {
        socket.value?.on("customInvite", (inviter: string) => {
          // theRoom = gameRoom;
          showInvite(true);
        });
      }
      if (!socket.value?.hasListeners("gameConfirmation")) {
        socket.value?.on("gameConfirmation", (gameRoom: any) => {
          // theRoom = gameRoom;
          showConfirmation(true);
        });
      }
      if (!socket.value?.hasListeners("invitation")) {
        socket.value?.on("invitation", (requester: string) => {
          invSender.value = requester;
          showInvite(true);
        });
      }
      if (!socket.value?.hasListeners("gameConfirmationTimeout")) {
        socket.value?.on("gameConfirmationTimeout", () => {
          showConfirmation(false);
          // startButton.value = true;
          // lobbyStatus.value = "Find Match";
        });
      }
      if (!socket.value?.hasListeners("friendshipInvite")) {
        socket.value?.on("friendshipInvite", (requester: User) => {
          incomingFriendRequest.value = requester.nickname;
          profileNotificationBadge.value = true;
          getUserByNickname(requester.nickname).then((data) => {
            store.user?.invitations?.push(data!);
          });
        });
      }
      if (!socket.value?.hasListeners("acceptInvite")) {
        socket.value?.on("acceptInvite", (requester: User) => {
          getUserByNickname(requester.nickname).then((data) => {
            store.user?.friends?.push(data!);
          });
        });
      }
      if (!socket.value?.hasListeners("removeFriend")) {
        socket.value?.on("removeFriend", (requester: User) => {
          getUserByNickname(requester.nickname).then((data) => {
            store.user?.friends?.splice(store.user?.friends?.indexOf(data!), 1);
          });
        });
      }
      if (!socket.value?.hasListeners("inviteFailure")) {
        socket.value?.on("inviteFailure", () => {
          showFailure(true);
        });
      }
      if (!socketLocal?.value?.hasListeners("Message to the client")) {
        socketLocal?.value?.on("Message to the client", async (privateMessage: Message) => {
          if (!isChannel(store.currentChat!) && privateMessage.author === (<Conversation>store.currentChat)?.other.nickname) {
            store.currentChat?.messages?.push(privateMessage);
          } else {
            addAlertMessage(`New message from ${privateMessage.author}`, 1);
          }
        });
      }
      if (!socketLocal?.value?.hasListeners("messageRecieved")) {
        socketLocal?.value?.on("messageReceived", (channelId: number, msg: Message) => {
          if (isChannel(store.currentChat!) && channelId === store.currentChat!.id) {
            store.currentChat?.messages?.push(msg);
          } else {
            addAlertMessage(`New message from ${msg.author} in channel`, 1);
          }
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
  height: 5vh;
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
