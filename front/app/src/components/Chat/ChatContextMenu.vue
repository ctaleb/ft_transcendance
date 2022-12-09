<template>
  <div @click="hideUserMenu()" class="contextMenu" v-if="menu.view" v-bind:style="{ top: menu.top.toString() + 'px', left: menu.left.toString() + 'px' }">
    <div class="header">
      <div class="name">{{ menu.user!.nickname }}</div>
      <div class="status">
        <i class="gg-shape-rhombus"></i>
        {{ menu.user!.status }}
      </div>
    </div>
    <hr />
    <button class="button" @click="watchProfile()">Profile</button>
    <button class="button" v-if="menu.user!.status == 'inGame'" @click="spectateGame()">Spectate</button>
    <button class="button" v-else-if="menu.user!.status == 'online'" @click="inviteCustom()">Invite</button>
    <button class="button" v-if="!isBlocked" @click="block()">Block</button>
    <button class="button" v-else title="Unblock user" @click="unblock()">Unblock</button>
    <button
      v-if="menu.requester && menu.requester!.role !== ChannelRole.MEMBER && (<ChannelUser>menu.user)!.role === ChannelRole.MEMBER"
      @click="showMuteModal = true"
    >
      Mute
    </button>
    <button
      v-if="menu.requester && menu.requester!.role !== ChannelRole.MEMBER && (<ChannelUser>menu.user)!.role === ChannelRole.MEMBER"
      @click="showBanModal = true"
    >
      Ban
    </button>
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

const spectateGame = () => {
  socketLocal.value?.emit("spectate", { friend: menu.value.user?.nickname }, (response: string) => {
    if (response == "ingame") {
      router.push("game");
      socketLocal.value?.emit("readySpectate", { friend: menu.value.user?.nickname });
    }
  });
};

const inviteCustom = () => {
  let accepted = "yes";
  socketLocal.value?.emit("customInvite", { friend: menu.value.user?.nickname }, (response: string) => {
    if (response != "accepted") {
      accepted = "no";
    }
  });
  if (accepted === "no") return;
  router.push("game");
  socketLocal.value?.emit("settingsInviter", { friend: menu.value.user?.nickname });
};

const block = async () => {
  if (menu.value.user)
    await fetchJSONDatas("api/friendship/block", "PUT", { addressee: menu.value.user?.nickname })
      .then(() => {
        isBlocked.value = true;
        addAlertMessage("The user has been blocked", 2);
      })
      .catch(() => {});
};

const unblock = async () => {
  if (menu.value.user)
    await fetchJSONDatas("api/friendship/unblock", "PUT", { addressee: menu.value.user?.nickname })
      .then(() => {
        isBlocked.value = false;
        addAlertMessage("The user has been unblocked", 2);
      })
      .catch((err) => {});
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
  background-color: rgb(48, 48, 68);
  border-radius: 10px;
  z-index: 50;
  position: absolute;
  display: flex;
  align-items: center;
  text-align: center;
  justify-content: center;
  flex-direction: column;
  padding: 10px;

  hr {
    margin: 0;
    width: 95%;
    border: 1px solid $primary;
    margin-bottom: 2px;
  }
  .button {
    width: 100%;
    height: 2%;
    display: flex;
    justify-content: center;
    align-items: center;
    border: none;
    &:hover {
      background: rgb(85, 85, 114);
    }
  }
  .name {
    color: $primary;
  }
  .header {
    color: $victory;
    display: flex;
    justify-content: space-around;
    align-items: center;
    width: 80%;
    .status {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-left: 5px;
      i {
        --ggs: 0.6;
      }
    }
  }
}
</style>
