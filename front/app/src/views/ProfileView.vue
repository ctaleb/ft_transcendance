<template @update-invitations="getRelations()">
  <svg preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" class="topSvg">
    <path fill="#C1A36B" fill-opacity="1" d="M0,224L288,256L576,224L864,224L1152,288L1440,256L1440,0L1152,0L864,0L576,0L288,0L0,0Z"></path>
  </svg>
  <section v-if="currentUserProfile !== undefined" id="profile" class="container">
    <div class="current-user">
      <div class="sideInfo">
        <img class="sideIcons" src="../assets/profileEloIcon.svg" alt="" />
        <h3>{{ currentUserProfile?.elo }}</h3>
      </div>
      <div>
        <img class="border-gold user-image" :src="User.getAvatar(currentUserProfile)" alt="" />
        <h3 class="playerName">
          {{ currentUserProfile?.nickname }} <i v-if="currentUserProfile.id === store.user?.id" class="gg-edit-markup" @click="redirectToEdit()"></i>
        </h3>
      </div>
      <div class="sideInfo">
        <img class="sideIcons" src="../assets/profileStatusIcon.svg" alt="" />
        <h3>{{ currentUserProfile.status }}</h3>
      </div>
    </div>
    <div class="buttonProfile" v-if="currentUserProfile?.id !== store.user?.id">
      <i
        v-if="!store.user?.friends?.find((friend) => friend.id === currentUserProfile?.id)"
        title="Add friend"
        class="gg-user-add"
        @click="invite(currentUserProfile)"
      ></i>
      <template v-else>
        <i title="Delete friend" class="gg-close-o" @click="unfriend(currentUserProfile)"></i>
        <i v-if="currentUserProfile.status === 'online'" title="Invite in game" class="gg-games" @click="User.inviteCustom(router, currentUserProfile)"></i>
      </template>
      <i title="Chat" class="gg-comment" @click="startConversation(currentUserProfile)"></i>
      <i v-if="currentUserProfileIsBlocked === false" title="Block user" class="gg-block" @click="block(currentUserProfile)"></i>
      <i v-else title="Unblock user" class="gg-unblock" @click="unblock(currentUserProfile)"></i>
      <i v-if="currentUserProfile.status === 'inGame'" title="Spectate your friend" class="gg-eye" @click="User.spectateGame(router, currentUserProfile)"></i>
    </div>
    <div class="subMenu">
      <button class="darkButton pulse" :style="toogleMenu ? '' : 'border: 1px solid white'" @click="watchFriend()">Friend</button>
      <button class="darkButton pulse" :style="toogleMenu ? 'border: 1px solid white' : ''" @click="watchHistory()">Match History</button>
    </div>
    <div class="search" :style="toogleMenu ? 'display: none' : ''">
      <div class="searchBar">
        <div class="searchIcon"><i class="gg-search"></i></div>
        <input type="text" class="input" name="searchFriend" v-model="searchFriend" placeholder="Player name" />
      </div>
      <button class="button pulse" @click="searchProfile()">Search Profile</button>
    </div>
    <div v-if="currentUserProfile.id === store.user?.id" class="invitations" :style="toogleMenu ? 'display: none' : ''">
      <ul>
        <InvitationCard v-for="invitation of store.user?.invitations" :invitation="invitation" />
      </ul>
    </div>
    <div class="friends" :style="toogleMenu ? 'display: none' : ''">
      <ul>
        <FriendCard v-for="friend of currentFriend" :friend="friend" />
      </ul>
    </div>
    <div class="summary" :style="toogleMenu ? '' : 'display: none'">
      <ul>
        <SummaryCard v-for="summary of currentSummary" :summary="summary" />
      </ul>
    </div>
    <img src="../assets/profileConfettis.svg" class="leftBottomSvg" alt="" />
  </section>
  <h4 v-else>User not found T_T</h4>
</template>

<script lang="ts" setup>
import FriendCard from "@/components/profile/FriendCard.vue";
import InvitationCard from "@/components/profile/InvitationCard.vue";
import SummaryCard from "@/components/profile/SummaryCard.vue";
import { addAlertMessage, fetchJSONDatas } from "@/functions/funcs";
import { currentUserProfile, socketLocal, useStore } from "@/store";
import { History } from "@/types/GameSummary";
import { getUserByNickname, User } from "@/types/User";
import { functionExpression, stringLiteral } from "@babel/types";
import { onMounted, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import editUrl from "../assets/edit.png";
import shutdownUrl from "../assets/shutdown.png";
import { useRouter } from "vue-router";
import { Conversation } from "@/types/Conversation";
import { transformDate } from "@/types/Message";
let funcs = require("../functions/funcs");

const router = useRouter();
const route = useRoute();

const store = useStore();

const searchFriend = ref("");
const toogleMenu = ref(false);

const currentUserProfileIsBlocked = ref(false);
const currentFriend = ref<User[]>();
const currentSummary = ref<History[]>();

onMounted(async () => {
  let nick = <string | undefined>route.params.nickname;

  watch(
    () => currentUserProfile.value,
    () => {
      fetchJSONDatas("api/profile/summary/" + currentUserProfile.value?.nickname, "GET")
        .then((data) => {
          currentSummary.value = data;
        })
        .catch(() => {});
      if (currentUserProfile.value && store.user && store.user!.id !== currentUserProfile.value!.id) {
        fetchJSONDatas(`api/friendship/isBlocked/${currentUserProfile.value?.id}`, "GET")
          .then((data) => {
            currentUserProfileIsBlocked.value = data;
          })
          .catch(() => {});
      }
    }
  );

  if (nick) {
    currentUserProfile.value = await getUserByNickname(nick).catch(() => {
      return undefined;
    });

    if (!currentUserProfile.value) return;
    await fetchJSONDatas("api/friendship/profile/" + nick, "GET")
      .then((data) => {
        currentFriend.value = data.friends;
      })
      .catch(() => {});
  } else {
    currentUserProfile.value = store.user;
    currentFriend.value = store.user?.friends;
    store.$subscribe((mutation, state) => {
      currentUserProfile.value = state.user;
      currentFriend.value = store.user?.friends;
    });
  }

  await fetch("http://" + window.location.hostname + ":3000/api/profile/summary/" + currentUserProfile.value?.nickname, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  })
    .then((data) => data.json())
    .then((data) => {
      currentSummary.value = data;
    });
  if (currentUserProfile.value && store.user && store.user!.id !== currentUserProfile.value!.id) {
    fetchJSONDatas(`api/friendship/isBlocked/${currentUserProfile.value?.id}`, "GET")
      .then((data) => {
        currentUserProfileIsBlocked.value = data;
      })
      .catch(() => {});
  }
});

const watchFriend = () => {
  toogleMenu.value = false;
};

const watchHistory = () => {
  toogleMenu.value = true;
};

const invite = async (user?: User) => {
  if (user)
    await fetchJSONDatas("api/friendship/invite", "POST", { addressee: user?.nickname })
      .then((data) => {
        socketLocal.value?.emit("friendship-invite", { id: store.user?.id, addresseeId: user?.id, target: user?.nickname, requester: store.user?.nickname });
        addAlertMessage("The user has been invited", 2);
      })
      .catch((err) => {});
};

const block = async (user?: User) => {
  if ((await User.block(user)) === true) currentUserProfileIsBlocked.value = true;
};

const unfriend = async (user?: User) => {
  if ((await User.unfriend(user)) === true) {
    store.user?.friends!.splice(store.user?.friends!.indexOf(user!), 1);
    socketLocal.value?.emit("unfriend", { id: store.user?.id, addresseeId: user!.id, target: user!.nickname, requester: store.user?.nickname });
  }
};

const unblock = async (user?: User) => {
  if ((await User.unblock(user)) === true) currentUserProfileIsBlocked.value = false;
};

const startConversation = (user?: User) => {
  if (user) {
    User.createConversation(user).then(async (conv) => {
      await fetchJSONDatas(`api/privateConv/getMessages/${conv.conv.id}/0`, "GET")
        .then((data) => {
          if (data.length > 0) conv.conv.messages = data;
          else conv.conv.messages = [];
          for (let i = 0; i < conv.conv.messages.length; i++) conv.conv.messages[i] = transformDate(conv.conv.messages[i]);
          conv.conv.other = user;
          store.currentChat = conv.conv;
        })
        .catch(() => {
          store.$patch({
            currentChat: undefined,
          });
        });
      router.push("/chat");
    });
  }
};

const searchProfile = async () => {
  if (searchFriend.value.length > 0)
    await getUserByNickname(searchFriend.value)
      .then(() => {
        router.push("/profile/" + searchFriend.value);
      })
      .catch(() => {});
  searchFriend.value = "";
};

function redirectToEdit() {
  router.push("/edit");
}
</script>
