<template>
  <div>
    <nav>
      <div
        style="display: flex; position: relative; justify-content: center"
        v-if="$route.path != '/' && $route.path != '/signup'"
      >
        <router-link to="/profile"
          >Profile
          <div :class="'dot' + (profileNotificationBadge ? ' show' : '')"></div
        ></router-link>
        |<router-link to="/game"> PLAY </router-link>|
        <router-link to="/chat">Chat</router-link>
      </div>
    </nav>
    <router-view
      :key="$route.fullPath"
      @notification="changeNotificationValue"
      :incoming-friend-request="incomingFriendRequest"
    />
    <div v-if="gameConfirmation" class="overlay">
      <modal @confirmGame="confirmGame()" @denyGame="denyGame()"></modal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router";
import config from "./config/config";
import Modal from "./components/GameConfirmation/Modal.vue";
import { getUserByNickname, trySetupUser } from "@/functions/funcs";
import { User } from "@/types/GameSummary";
import { useStore } from "@/store";

const store = useStore();
const route = useRoute();
const router = useRouter();
const incomingFriendRequest = ref("");
const profileNotificationBadge = ref(false);
const gameConfirmation = ref(false);

trySetupUser();

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
  if (e.key === "a")
    config.socket.emit("key", {
      key: "downA",
    });
  else if (e.key === "d")
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
  showConfirmation(false);
};

const changeNotificationValue = (value: boolean) => {
  profileNotificationBadge.value = value;
};

function showConfirmation(show: boolean) {
  gameConfirmation.value = show;
}

onMounted(() => {
  watch(
    () => route.path,
    (currentValue, oldValue) => {
      if (!config.socket.hasListeners("gameConfirmation")) {
        config.socket.on("gameConfirmation", (gameRoom: any) => {
          console.log("???");
          // theRoom = gameRoom;
          showConfirmation(true);
        });
      }
      if (!config.socket.hasListeners("gameConfirmationTimeout")) {
        config.socket.on("gameConfirmationTimeout", () => {
          console.log("$$$");
          showConfirmation(false);
          // startButton.value = true;
          // lobbyStatus.value = "Find Match";
        });
      }
      if (!config.socket.hasListeners("friendshipInvite")) {
        config.socket.on("friendshipInvite", (requester: User) => {
          incomingFriendRequest.value = requester.nickname;
          profileNotificationBadge.value = true;
          getUserByNickname(requester.nickname).then((data) => {
            store.invitations?.push(data!);
          });
        });
      }
      if (!config.socket.hasListeners("acceptInvite")) {
        config.socket.on("acceptInvite", (requester: User) => {
          getUserByNickname(requester.nickname).then((data) => {
            store.user?.friends?.push(data!);
          });
        });
      }
      if (!config.socket.hasListeners("removeFriend")) {
        config.socket.on("removeFriend", (requester: User) => {
          getUserByNickname(requester.nickname).then((data) => {
            store.user?.friends?.splice(store.user?.friends?.indexOf(data!), 1);
          });
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
