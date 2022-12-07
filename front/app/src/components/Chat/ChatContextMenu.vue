<template>
  <div @click="hideUserMenu()" class="contextMenu" v-if="menu.view" v-bind:style="{ top: menu.top.toString() + 'px', left: menu.left.toString() + 'px' }">
    <div class="name">{{ menu.user!.nickname }}</div>
    <div class="status">{{ menu.user!.status }}</div>
    <button @click="watchProfile()">Profile</button>
    <button @click="invite()">Friend Request</button>
    <button v-if="menu.user!.status == 'inGame'" @click="spectateGame()">Spectate</button>
    <button v-if="menu.user!.status == 'online'" @click="inviteCustom()">Invite</button>
    <button v-if="isBlocked" @click="block()">Block</button>
    <button v-else title="Unblock user" class="gg-block" @click="unblock(currentUserProfile)"></button>
  </div>
</template>

<!-- Need to add isBlocked() to show/ornot blockbutton -->

<script setup lang="ts">
import { addAlertMessage, fetchJSONDatas, hideUserMenu } from "@/functions/funcs";
import { currentUserProfile, menu, socketLocal, useStore } from "@/store";
import { User } from "@/types/User";
import { onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";

const store = useStore();
const router = useRouter();

const isBlocked = ref(false);

onMounted(async () => {
  watch(
    () => menu.value,
    () => {
      if (store.user?.id != currentUserProfile.value!.id) {
        fetchJSONDatas(`api/friendship/isBlocked/${currentUserProfile.value?.id}`, "GET")
          .then((data) => {
            isBlocked.value = data;
          })
          .catch(() => {});
      }
    }
  );
});

const watchProfile = () => {
  router.push("/profile/" + menu.value.user?.nickname);
};

const spectateGame = () => {
  socketLocal.value?.emit("spectate", menu.value.user?.nickname, (response: string) => {
    if (response == "ingame") {
      router.push("game");
      socketLocal.value?.emit("readySpectate", menu.value.user?.nickname);
    }
  });
};

const inviteCustom = () => {
  let accepted = "yes";
  socketLocal.value?.emit("customInvite", menu.value.user?.nickname, (response: string) => {
    if (response != "accepted") {
      accepted = "no";
    }
  });
  if (accepted === "no") return;
  router.push("game");
  socketLocal.value?.emit("settingsInviter", menu.value.user?.nickname);
};

const invite = async () => {
  if (menu.value.user)
    await fetchJSONDatas("api/friendship/invite", "POST", { addressee: menu.value.user?.nickname })
      .then(() => {
        addAlertMessage("The user has been invited", 2);
      })
      .catch(() => {});
};

const block = async () => {
  if (menu.value.user)
    await fetchJSONDatas("api/friendship/block", "PUT", { addressee: menu.value.user?.nickname })
      .then(() => {
        addAlertMessage("The user has been blocked", 2);
      })
      .catch(() => {});
};

const unblock = async (user: User | undefined) => {
  if (user)
    await fetchJSONDatas("api/friendship/unblock", "PUT", { addressee: user.nickname })
      .then(() => {
        isBlocked.value = false;
        addAlertMessage("The user has been unblocked", 2);
      })
      .catch((err) => {});
};
</script>

<style lang="scss" scoped>
@import "@/styles/variables";
.contextMenu {
  background-color: $background;
  z-index: 50;
  position: absolute;
  display: flex;
  align-items: center;
  text-align: center;
  justify-content: center;
  flex-direction: column;
  width: 60px;

  .name {
    color: $primary;
  }
  .status {
    color: $victory;
  }
  button {
    background-color: $background;
    color: $primary;
    border: 1px solid lighten($background, 20%);
    height: 20px;
    width: 60px;
    transition: all 0.5s ease;

    &:hover {
      background-color: lighten($background, 20%);
      border: 1px solid $primary;
    }
  }
}
</style>
