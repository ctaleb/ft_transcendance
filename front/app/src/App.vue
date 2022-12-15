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
      <div v-if="gameConfirmation">
        <GameConfirmation @confirmGame="confirmGame()" @denyGame="denyGame()"></GameConfirmation>
      </div>
      <div v-if="customInvitation">
        <CustomInvitation :inviter="invSender" @acceptCustom="acceptCustom()" @denyCustom="denyCustom()"></CustomInvitation>
      </div>
      <div v-if="failedInvitation">
        <FailedInvitation @invFailure="invFailure()"></FailedInvitation>
      </div>
      <div v-if="multiClientWarning" class="overlay">
        <MultiClientWarning></MultiClientWarning>
      </div>
      <div class="alertFlex">
        <AlertCard v-for="message of alertMessages" :message="message" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ChatContextMenu from "@/components/chat/ChatContextMenu.vue";
import { addAlertMessage, hideUserMenu, trySetupUser, updateStatus } from "@/functions/funcs";
import { privateConvs, socketLocal, useStore } from "@/store";
import { Channel, isChannel } from "@/types/Channel";
import { Conversation } from "@/types/Conversation";
import { Alert } from "@/types/GameSummary";
import { Message, transformDate } from "@/types/Message";
import { getUserByNickname } from "@/types/User";
import { onMounted, onUnmounted, ref, watch } from "vue";
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router";
import AlertCard from "./components/AlertCard.vue";
import CustomInvitation from "./components/CustomInvitation/Modal.vue";
import FailedInvitation from "./components/FailedInvitation/Modal.vue";
import GameConfirmation from "./components/GameConfirmation/Modal.vue";
import MultiClientWarning from "./components/MultiClientWarning/Modal.vue";

const store = useStore();
const route = useRoute();
const router = useRouter();
const gameConfirmation = ref(false);
const customInvitation = ref(false);
const failedInvitation = ref(false);
const multiClientWarning = ref(false);
const invSender = ref("Placeholder");

trySetupUser().catch((err) => {
  console.log("Cant't set up user for now");
});

let alertMessages: Alert[] = store.message;

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft")
    socketLocal?.value?.emit("key", {
      key: "downLeft",
    });
  else if (e.key === "ArrowRight")
    socketLocal?.value?.emit("key", {
      key: "downRight",
    });
  if (e.key === "a" || e.key === "A")
    socketLocal?.value?.emit("key", {
      key: "downA",
    });
  else if (e.key === "d" || e.key === "D")
    socketLocal?.value?.emit("key", {
      key: "downD",
    });
  else if (e.key === " ") {
    socketLocal?.value?.emit("key", {
      key: "downSpace",
    });
  }
  if (e.key === "o") socketLocal?.value?.emit("debugging");
  if (e.key === "i") socketLocal?.value?.emit("chatting");
});

window.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft")
    socketLocal?.value?.emit("key", {
      key: "upLeft",
    });
  else if (e.key === "ArrowRight")
    socketLocal?.value?.emit("key", {
      key: "upRight",
    });
  if (e.key === "a")
    socketLocal?.value?.emit("key", {
      key: "upA",
    });
  else if (e.key === "d")
    socketLocal?.value?.emit("key", {
      key: "upD",
    });
});

const confirmGame = () => {
  socketLocal?.value?.emit("playerReady", {}, () => {});
  showConfirmation(false);
  router.push("/game");
};

const denyGame = () => {
  socketLocal?.value?.emit("playerNotReady");
  showConfirmation(false);
};

const acceptCustom = () => {
  showInvite(false);
  router.push("/game");
  socketLocal?.value?.emit("settingsInvitee");
};

const denyCustom = () => {
  socketLocal?.value?.emit("declineCustom");
  showInvite(false);
};

const invFailure = () => {
  showFailure(false);
};

const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  socketLocal.value?.emit("disco");
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

function showMultiClientWarning(show: boolean) {
  multiClientWarning.value = show;
}

onMounted(() => {
  watch(
    () => route.path,
    (newValue, oldValue) => {
      if (route.path != "/chat") {
        privateConvs.value = [];
        store.$patch({
          currentChat: undefined,
        });
      }
      socketLocal?.value?.emit("watchPath", { oldValue, newValue });
      showInvite(false);
      showConfirmation(false);
    }
  );
  if (socketLocal.value) {
    socketLocal.value?.on("noMultiClient", () => {
      showMultiClientWarning(true);
    });
    socketLocal.value?.on("updateOneUserStatus", (obj: { id: number; status: string }) => {
      updateStatus(obj.id, obj.status);
    });
    socketLocal.value?.on("customInvite", (inviter: string) => {
      // theRoom = gameRoom;
      showInvite(true);
    });
    socketLocal.value?.on("gameConfirmation", (gameRoom: any) => {
      // theRoom = gameRoom;
      showConfirmation(true);
    });
    socketLocal.value?.on("invitation", (requester: string) => {
      invSender.value = requester;
      showInvite(true);
    });
    socketLocal.value?.on("blocked", (userId: number, nickname: string) => {
      if (store.user && store.user.invitations) {
        store.user.invitations = store.user.invitations.filter((invit) => invit.id !== userId);
      }
    });
    socketLocal.value?.on("gameConfirmationTimeout", () => {
      showConfirmation(false);
      // startButton.value = true;
      // lobbyStatus.value = "Find Match";
    });
    socketLocal.value?.on("friendshipInvite", (requester: string) => {
      getUserByNickname(requester).then((data) => {
        store.user?.invitations?.push(data!);
        addAlertMessage(`Incoming friendship request from ${requester}`, 1);
      });
    });
    socketLocal.value?.on("acceptInvite", (requester: string) => {
      getUserByNickname(requester).then((data) => {
        store.user?.friends?.push(data!);
      });
    });
    socketLocal.value?.on("removeFriend", (requester: string) => {
      getUserByNickname(requester).then((data) => {
        store.user?.friends?.splice(store.user?.friends?.indexOf(data!), 1);
      });
    });
    socketLocal.value?.on("inviteFailure", () => {
      showFailure(true);
    });
    socketLocal?.value?.on("Message to the client", async (privateMessage: Message) => {
      if (!isChannel(store.currentChat!) && privateMessage.author === (<Conversation>store.currentChat)?.other.nickname) {
        store.currentChat?.messages?.push(transformDate(privateMessage));
      } else {
        addAlertMessage(`New message from ${privateMessage.author}`, 1);
      }
    });
    socketLocal.value?.on("messageReceived", (channelId: number, channelName: string, msg: Message) => {
      if (isChannel(store.currentChat!) && channelId === store.currentChat!.id) {
        store.currentChat?.messages?.push(transformDate(msg));
      } else {
        addAlertMessage(`New message from ${msg.author} in "${channelName}"`, 1);
      }
    });
    socketLocal.value?.on("incomingChannelInvitation", (channel: string) => {
      addAlertMessage(`You've been invited to join "${channel}" channel`, 1);
    });
    socketLocal.value?.on("gotBannedFromChannel", (channel: string) => {
      if (store.currentChat && isChannel(store.currentChat!) && (<Channel>store.currentChat)?.name === channel) {
        store.$patch({
          currentChat: undefined,
        });
      }
      addAlertMessage(`You've been banned from "${channel}" channel`, 3);
    });
    socketLocal.value?.on("gotUnbannedFromChannel", (channel: string) => {
      addAlertMessage(`You've been unbanned from "${channel}" channel`, 1);
    });
  }
  watch(
    () => socketLocal.value,
    () => {
      socketLocal.value?.removeListener("noMultiClient");
      socketLocal.value?.on("noMultiClient", () => {
        showMultiClientWarning(true);
      });
      socketLocal.value?.removeListener("updateOneUserStatus");
      socketLocal.value?.on("updateOneUserStatus", (obj: { id: number; status: string }) => {
        updateStatus(obj.id, obj.status);
      });
      socketLocal.value?.removeListener("customInvite");
      socketLocal.value?.on("customInvite", (inviter: string) => {
        // theRoom = gameRoom;
        showInvite(true);
      });
      socketLocal.value?.removeListener("gameConfirmation");
      socketLocal.value?.on("gameConfirmation", (gameRoom: any) => {
        // theRoom = gameRoom;
        showConfirmation(true);
      });
      socketLocal.value?.removeListener("invitation");
      socketLocal.value?.on("invitation", (requester: string) => {
        invSender.value = requester;
        showInvite(true);
      });
      socketLocal.value?.removeListener("blocked");
      socketLocal.value?.on("blocked", (userId: number, nickname: string) => {
        if (store.user && store.user.invitations) {
          store.user.invitations = store.user.invitations.filter((invit) => invit.id !== userId);
        }
      });
      socketLocal.value?.removeListener("gameConfirmationTimeout");
      socketLocal.value?.on("gameConfirmationTimeout", () => {
        showConfirmation(false);
        // startButton.value = true;
        // lobbyStatus.value = "Find Match";
      });
      socketLocal.value?.removeListener("friendshipInvite");
      socketLocal.value?.on("friendshipInvite", (requester: string) => {
        getUserByNickname(requester).then((data) => {
          store.user?.invitations?.push(data!);
          addAlertMessage(`Incoming friendship request from ${requester}`, 1);
        });
      });
      socketLocal.value?.removeListener("acceptInvite");
      socketLocal.value?.on("acceptInvite", (requester: string) => {
        getUserByNickname(requester).then((data) => {
          store.user?.friends?.push(data!);
        });
      });
      socketLocal.value?.removeListener("removeFriend");
      socketLocal.value?.on("removeFriend", (requester: string) => {
        getUserByNickname(requester).then((data) => {
          store.user?.friends?.splice(store.user?.friends?.indexOf(data!), 1);
        });
      });
      socketLocal.value?.removeListener("inviteFailure");
      socketLocal.value?.on("inviteFailure", () => {
        showFailure(true);
      });
      socketLocal.value?.removeListener("Message to the client");
      socketLocal?.value?.on("Message to the client", async (privateMessage: Message) => {
        if (!isChannel(store.currentChat!) && privateMessage.author === (<Conversation>store.currentChat)?.other.nickname) {
          store.currentChat?.messages?.push(transformDate(privateMessage));
        } else {
          addAlertMessage(`New message from ${privateMessage.author}`, 1);
        }
      });
      socketLocal.value?.removeListener("messageReceived");
      socketLocal.value?.on("messageReceived", (channelId: number, channelName: string, msg: Message) => {
        if (isChannel(store.currentChat!) && channelId === store.currentChat!.id) {
          store.currentChat?.messages?.push(transformDate(msg));
        } else {
          addAlertMessage(`New message from ${msg.author} in "${channelName}"`, 1);
        }
      });
      socketLocal.value?.removeListener("incomingChannelInvitation");
      socketLocal.value?.on("incomingChannelInvitation", (channel: string) => {
        addAlertMessage(`You've been invited to join "${channel}" channel`, 1);
      });
      socketLocal.value?.removeListener("gotBannedFromChannel");
      socketLocal.value?.on("gotBannedFromChannel", (channel: string) => {
        if (store.currentChat && isChannel(store.currentChat!) && (<Channel>store.currentChat)?.name === channel) {
          store.$patch({
            currentChat: undefined,
          });
        }
        addAlertMessage(`You've been banned from "${channel}" channel`, 3);
      });
      socketLocal.value?.removeListener("gotUnbannedFromChannel");
      socketLocal.value?.on("gotUnbannedFromChannel", (channel: string) => {
        addAlertMessage(`You've been unbanned from "${channel}" channel`, 1);
      });
    }
  );
});

onUnmounted(() => {
  socketLocal.value?.removeListener("noMultiClient");
  socketLocal.value?.removeListener("updateOneUserStatus");
  socketLocal.value?.removeListener("customInvite");
  socketLocal.value?.removeListener("gameConfirmation");
  socketLocal.value?.removeListener("invitation");
  socketLocal.value?.removeListener("blocked");
  socketLocal.value?.removeListener("gameConfirmationTimeout");
  socketLocal.value?.removeListener("friendshipInvite");
  socketLocal.value?.removeListener("acceptInvite");
  socketLocal.value?.removeListener("removeFriend");
  socketLocal.value?.removeListener("inviteFailure");
  socketLocal.value?.removeListener("Message to the client");
  socketLocal.value?.removeListener("messageReceived");
  socketLocal.value?.removeListener("incomingChannelInvitation");
  socketLocal.value?.removeListener("gotBannedFromChannel");
  socketLocal.value?.removeListener("gotUnbannedFromChannel");
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

.inLobby {
  color: yellow !important;
}
.inQueue {
  color: blue !important;
}
.inGame {
  color: orange !important;
}
.online {
  color: green !important;
}
.offline {
  color: red !important;
}
.spectating {
  color: purple !important;
}
.inCustomLobby {
  color: skyblue !important;
}
.hostingCustomLobby {
  color: skyblue !important;
}
.invited {
  color: darkblue !important;
}
</style>
