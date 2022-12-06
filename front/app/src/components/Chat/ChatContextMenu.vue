<template>
  <div class="contextMenu" v-if="menu.view" v-bind:style="{ top: menu.top.toString() + 'px', left: menu.left.toString() + 'px' }">
    <button @click="watchProfile()">Profile</button>
    <button @click="invite()">Invite</button>
    <button v-if="menu.user!.status == 'inGame'" @click="spectateGame()">Spectate</button>
    <button v-if="menu.user!.status == 'online'" @click="inviteCustom()">Custom</button>
    <button @click="block()">Block</button>
  </div>
</template>

<!-- Need to add isBlocked() to show/ornot blockbutton -->

<script setup lang="ts">
import { fetchJSONDatas } from "@/functions/funcs";
import { menu, useStore } from "@/store";
import { useRouter } from "vue-router";

const store = useStore();
const router = useRouter();

const watchProfile = () => {
  router.push("/profile/" + menu.value.user?.nickname);
};

const spectateGame = () => {
  store.socket?.emit("spectate", menu.value.user?.nickname, (response: string) => {
    if (response == "ingame") {
      router.push("game");
      store.socket?.emit("readySpectate", menu.value.user?.nickname);
    }
  });
};

const inviteCustom = () => {
  let accepted = "yes";
  store.socket?.emit("customInvite", menu.value.user?.nickname, (response: string) => {
    if (response != "accepted") {
      accepted = "no";
    }
  });
  if (accepted === "no") return;
  router.push("game");
  store.socket?.emit("settingsInviter", menu.value.user?.nickname);
};

const invite = async () => {
  if (menu.value.user) await fetchJSONDatas("api/friendship/invite", "POST", { addressee: menu.value.user?.nickname }).catch(() => {});
};

const block = async () => {
  if (menu.value.user) await fetchJSONDatas("api/friendship/block", "PUT", { addressee: menu.value.user?.nickname }).catch(() => {});
};
</script>

<style lang="scss" scoped>
@import "@/styles/variables";
.contextMenu {
  display: flex;
  flex-direction: column;
  width: 60px;

  button {
    background-color: $background;
    color: $primary;
    border: 1px solid lighten($background, 20%);
    height: 20px;
    width: 60px;
    transition: all 0.5s ease;

    :hover {
      background-color: lighten($background, 20%);
      border: 1px solid $primary;
    }
  }
}
</style>
