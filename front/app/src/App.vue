<template>
  <div>
    <nav class="navbar" v-if="$route.path != '/' && $route.path != '/signup'">
      <img src="./assets/navbarLogo.gif" width="85" height="85" alt="" />
      <div class="links">
        <router-link to="/profile" class="link"
          >Profile
          <div :class="'dot' + (profileNotificationBadge ? ' show' : '')"></div
        ></router-link>
        <router-link to="/game" class="link"> PLAY </router-link>
        <router-link to="/chat" class="link">Chat</router-link>
        <router-link to="/" class="link" v-on:click.prevent="logout()">Logout</router-link>
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
import { addAlertMessage, trySetupUser, updateStatus } from "@/functions/funcs";
import { useStore } from "@/store";
import { Channel, isChannel } from "@/types/Channel";
import { Conversation } from "@/types/Conversation";
import { Alert } from "@/types/GameSummary";
import { Message, transformDate } from "@/types/Message";
import { getUserByNickname, User } from "@/types/User";
import { onMounted, ref, watch } from "vue";
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router";
import dayjs from "dayjs";
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
    state.socket?.on("friendshipInvite", (requester: string) => {
      incomingFriendRequest.value = requester;
      profileNotificationBadge.value = true;
      getUserByNickname(requester).then((data) => {
        state.user?.invitations?.push(data!);
      });
    });
  }
  if (!state.socket?.hasListeners("acceptInvite")) {
    state.socket?.on("acceptInvite", (requester: string) => {
      getUserByNickname(requester).then((data) => {
        state.user?.friends?.push(data!);
      });
    });
  }
  if (!state.socket?.hasListeners("removeFriend")) {
    state.socket?.on("removeFriend", (requester: string) => {
      getUserByNickname(requester).then((data) => {
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

// //chat listeners
// if (!store.socket?.hasListeners("Message to the client")) {
//   store.socket?.on("Message to the client", async (privateMessage: Message) => {
//     console.log(store.currentChat);
//     if (privateMessage.author === (<Conversation>store.currentChat)?.other.nickname) {
//       store.currentChat?.messages?.push(privateMessage);
//     } else {
//       console.log("received");
//       addAlertMessage(`New message from ${privateMessage.author}`, 1);
//     }
//   });
// }
// if (!store.socket?.hasListeners("messageRecieved")) {
//   store.socket?.on("messageReceived", (channelId: number, msg: Message) => {
//     if (isChannel(store.currentChat!) && channelId === store.currentChat!.id) {
//       store.currentChat?.messages?.push(msg);
//     } else {
//       addAlertMessage(`New message from ${msg.author} in channel`, 1);
//     }
//   });
// }

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
  socket?.emit("disco", {});
  socket?.close();
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
      store.$patch({
        currentChat: undefined,
      });
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

  watch(
    () => store.socket,
    () => {
      //chat listeners
      if (!store.socket?.hasListeners("Message to the client")) {
        store.socket?.on("Message to the client", async (privateMessage: Message) => {
          if (!isChannel(store.currentChat!) && privateMessage.author === (<Conversation>store.currentChat)?.other.nickname) {
            store.currentChat?.messages?.push(transformDate(privateMessage));
          } else {
            addAlertMessage(`New message from ${privateMessage.author}`, 1);
          }
        });
      }
      if (!store.socket?.hasListeners("messageRecieved")) {
        store.socket?.on("messageReceived", (channelId: number, channelName: string, msg: Message) => {
          if (isChannel(store.currentChat!) && channelId === store.currentChat!.id) {
            store.currentChat?.messages?.push(transformDate(msg));
          } else {
            addAlertMessage(`New message from ${msg.author} in "${channelName}"`, 1);
          }
        });
      }
      if (!store.socket?.hasListeners("incomingChannelInvitation")) {
        store.socket?.on("incomingChannelInvitation", (channel: string) => {
          addAlertMessage(`You've been invited to join "${channel}" channel`, 1);
        });
      }
      if (!store.socket?.hasListeners("gotBannedFromChannel")) {
        store.socket?.on("gotBannedFromChannel", (channel: string) => {
          if (store.currentChat && isChannel(store.currentChat!) && (<Channel>store.currentChat)?.name === channel) {
            store.$patch({
              currentChat: undefined,
            });
          }
          addAlertMessage(`You've been banned from "${channel}" channel`, 3);
        });
      }
      if (!store.socket?.hasListeners("gotUnbannedFromChannel")) {
        store.socket?.on("gotUnbannedFromChannel", (channel: string) => {
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
  height: 7vh;
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
