<template>
  <div @click="hideUserMenu()" class="contextMenu" v-if="menu.view" v-bind:style="{ top: menu.top.toString() + 'px', left: menu.left.toString() + 'px' }">
    <div class="name">{{ menu.user!.nickname }}</div>
    <div class="status">{{ menu.user!.status }}</div>
    <button @click="watchProfile()">Profile</button>
    <button v-if="menu.user!.status == 'inGame'" @click="User.spectateGame(router, menu.user)">Spectate</button>
    <button v-else-if="menu.user!.status == 'online'" @click="User.inviteCustom(router, menu.user)">Invite</button>
    <button v-if="!isBlocked" @click="block()">Block</button>
    <button v-else title="Unblock user" @click="unblock()">Unblock</button>
    <template v-if="menu.requester && menu.requester!.role !== ChannelRole.MEMBER && (<ChannelUser>menu.user)!.role === ChannelRole.MEMBER">
      <button @click="showMuteModal = true">Mute</button>
      <button @click="showBanModal = true">Ban</button>
    </template>
    <button v-if="menu.requester && menu.requester!.role === ChannelRole.OWNER && (<ChannelUser>menu.user)!.role === ChannelRole.MEMBER" @click="giveTakeAdmin">
      Give admin
    </button>
    <button v-if="menu.requester && menu.requester!.role === ChannelRole.OWNER && (<ChannelUser>menu.user)!.role === ChannelRole.ADMIN" @click="giveTakeAdmin">
      Take admin
    </button>
  </div>
  <MuteModal v-if="showMuteModal" @close-mute-modal="showMuteModal = false" :member="(<ChannelUser>menu.user)!" />
  <BanModal v-if="showBanModal" @close-ban-modal="showBanModal = false" :member="(<ChannelUser>menu.user)!" />
</template>

<!-- Need to add isBlocked() to show/ornot blockbutton -->

<script setup lang="ts">
import MuteModal from "@/components/chat/modals/MuteModal.vue";
import BanModal from "@/components/chat/modals/BanModal.vue";
import { addAlertMessage, fetchJSONDatas, hideUserMenu } from "@/functions/funcs";
import { currentUserProfile, menu, socketLocal, useStore } from "@/store";
import { ChannelRole, ChannelUser } from "@/types/Channel";
import { User } from "@/types/User";
import { onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";

const store = useStore();
const router = useRouter();

const isBlocked = ref(false);
const showMuteModal = ref(false);
const showBanModal = ref(false);

const emits = defineEmits(["closeMuteModal", "closeBanModal"]);

onMounted(async () => {
  watch(
    () => menu.value.view,
    () => {
      if (menu.value.view === true && store.user?.id != menu.value.user?.id) {
        fetchJSONDatas(`api/friendship/isBlocked/${menu.value.user?.id}`, "GET")
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

const block = async () => {
  if ((await User.block(menu.value.user)) === true) isBlocked.value = true;
};

const unblock = async () => {
  if ((await User.unblock(menu.value.user)) === true) isBlocked.value = false;
};

const giveTakeAdmin = async () => {
  if (menu.value.user && menu.value.requester && menu.value.requester.role === ChannelRole.OWNER) {
    if ((<ChannelUser>menu.value.user).role === ChannelRole.MEMBER) {
      await giveAdmin(<ChannelUser>menu.value.user);
    } else {
      await takeAdmin(<ChannelUser>menu.value.user);
    }
    socketLocal.value?.emit("updateChannelMembers", { id: store.currentChat!.id });
  } else {
    addAlertMessage("You have no right to change channel members role", 3);
  }
};

const giveAdmin = async (member: ChannelUser): Promise<void> => {
  await fetchJSONDatas("api/chat/give-admin", "PUT", {
    id: store.currentChat!.id,
    username: member.nickname,
  }).catch(() => {});
};

<<<<<<< HEAD
const block = async () => {
  if (menu.value.user)
    await fetchJSONDatas("api/friendship/block", "PUT", { addressee: menu.value.user?.nickname })
      .then(() => {
        isBlocked.value = true;
        addAlertMessage("The user has been blocked", 2);
      })
      .catch(() => {});
=======
const takeAdmin = async (member: ChannelUser): Promise<void> => {
  await fetchJSONDatas("api/chat/take-admin", "PUT", {
    id: store.currentChat!.id,
    username: member.nickname,
  }).catch(() => {});
};

const giveTakeAdmin = async () => {
  if (menu.value.user && menu.value.requester && menu.value.requester.role === ChannelRole.OWNER) {
    if ((<ChannelUser>menu.value.user).role === ChannelRole.MEMBER) {
      await giveAdmin(<ChannelUser>menu.value.user);
    } else {
      await takeAdmin(<ChannelUser>menu.value.user);
    }
    socketLocal.value?.emit("updateChannelMembers", { id: store.currentChat!.id });
  } else {
    addAlertMessage("You have no right to change channel members role", 3);
  }
};

const giveAdmin = async (member: ChannelUser): Promise<void> => {
  await fetchJSONDatas("api/chat/give-admin", "PUT", {
    id: store.currentChat!.id,
    username: member.nickname,
  }).catch(() => {});
>>>>>>> a5adea031be32b07cba6749a4260aef6aad2fd7b
};

const takeAdmin = async (member: ChannelUser): Promise<void> => {
  await fetchJSONDatas("api/chat/take-admin", "PUT", {
    id: store.currentChat!.id,
    username: member.nickname,
  }).catch(() => {});
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
