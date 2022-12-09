<template>
  <ChatContextMenu />
  <div @click="hideUserMenu()">
    <div>
      <nav class="navbar" v-if="$route.path != '/' && $route.path != '/signup'">
        <img src="./assets/navbarLogo.gif" width="85" height="85" alt="" />
        <div class="links">
          <router-link to="/profile" class="link">Profile </router-link>
          <router-link to="/game" class="link"> PLAY </router-link>
          <router-link to="/chat" class="link">Chat</router-link>
          <router-link to="/" class="link" v-on:click.prevent="logout()">Logout</router-link>
        </div>
      </nav>
      <router-view :key="$route.fullPath" />
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
  </div>
</template>

<script setup lang="ts">
import { addAlertMessage, trySetupUser, updateStatus, hideUserMenu } from "@/functions/funcs";
import ChatContextMenu from "@/components/chat/ChatContextMenu.vue";
import { currentUserProfile, privateConvs, socketLocal, useStore } from "@/store";
import { Channel, isChannel } from "@/types/Channel";
import { Conversation } from "@/types/Conversation";
import { Alert } from "@/types/GameSummary";
import { Message, transformDate } from "@/types/Message";
import { getUserByNickname } from "@/types/User";
import { onMounted, ref, watch } from "vue";
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router";
import AlertCard from "./components/AlertCard.vue";
import CustomInvitation from "./components/CustomInvitation/Modal.vue";
import FailedInvitation from "./components/FailedInvitation/Modal.vue";
import GameConfirmation from "./components/GameConfirmation/Modal.vue";

const store = useStore();
const route = useRoute();
const router = useRouter();
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
  socketLocal.value?.emit("disco", {});
  socketLocal.value?.close();
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
    () => {
      if (route.path != "/chat") {
        privateConvs.value = [];
        store.$patch({
          currentChat: undefined,
        });
      }
    }
  );

  watch(
    () => socketLocal.value,
    () => {
      if (!socket.value?.hasListeners("updateOneUserStatus")) {
        socket.value?.on("updateOneUserStatus", (obj: { id: number; status: string }) => {
          updateStatus(obj.id, obj.status);
        });
      }
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
        socket.value?.on("friendshipInvite", (requester: string) => {
          getUserByNickname(requester).then((data) => {
            store.user?.invitations?.push(data!);
            addAlertMessage(`Incoming friendship request from ${requester}`, 1);
          });
        });
      }
      if (!socket.value?.hasListeners("acceptInvite")) {
        socket.value?.on("acceptInvite", (requester: string) => {
          getUserByNickname(requester).then((data) => {
            store.user?.friends?.push(data!);
          });
        });
      }
      if (!socket.value?.hasListeners("removeFriend")) {
        socket.value?.on("removeFriend", (requester: string) => {
          getUserByNickname(requester).then((data) => {
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
            store.currentChat?.messages?.push(transformDate(privateMessage));
          } else {
            addAlertMessage(`New message from ${privateMessage.author}`, 1);
          }
        });
      }
      if (!socketLocal.value?.hasListeners("messageRecieved")) {
        socketLocal.value?.on("messageReceived", (channelId: number, channelName: string, msg: Message) => {
          if (isChannel(store.currentChat!) && channelId === store.currentChat!.id) {
            store.currentChat?.messages?.push(transformDate(msg));
          } else {
            addAlertMessage(`New message from ${msg.author} in "${channelName}"`, 1);
          }
        });
      }
      if (!socketLocal.value?.hasListeners("incomingChannelInvitation")) {
        socketLocal.value?.on("incomingChannelInvitation", (channel: string) => {
          addAlertMessage(`You've been invited to join "${channel}" channel`, 1);
        });
      }
      if (!socketLocal.value?.hasListeners("gotBannedFromChannel")) {
        socketLocal.value?.on("gotBannedFromChannel", (channel: string) => {
          if (store.currentChat && isChannel(store.currentChat!) && (<Channel>store.currentChat)?.name === channel) {
            store.$patch({
              currentChat: undefined,
            });
          }
          addAlertMessage(`You've been banned from "${channel}" channel`, 3);
        });
      }
      if (!socketLocal.value?.hasListeners("gotUnbannedFromChannel")) {
        socketLocal.value?.on("gotUnbannedFromChannel", (channel: string) => {
          addAlertMessage(`You've been unbanned from "${channel}" channel`, 1);
        });
      }
    }
  );
});
</script>

<style lang="scss">
@import "styles/custom.scss";

body {
  background-color: $secondary;
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
  height: 100px;
  @include screen-md {
    height: 130px;
  }
  width: 100vw;
  background: $secondary;
  display: flex;
  justify-content: center;
  align-items: center;
  border-bottom: 1px solid $primary;
  img {
    margin-left: 15px;
    margin-right: auto;
  }
  .links {
    width: 20%;
    @include screen-lg {
      width: 40%;
    }
    @include screen-md {
      width: 60%;
    }
    @include screen-sm {
      width: 70%;
    }
    @include screen-xs {
      width: 80%;
    }
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
    .link {
      text-decoration: none;
      color: $primary;
    }
  }
}

.text-red {
  color: red;
}

.hidden {
  display: none !important;
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
