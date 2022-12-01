<template @update-invitations="getRelations()">
  <svg preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" class="topSvg">
    <path fill="#C1A36B" fill-opacity="1" d="M0,224L288,256L576,224L864,224L1152,288L1440,256L1440,0L1152,0L864,0L576,0L288,0L0,0Z"></path>
  </svg>
  <section v-if="currentUser !== undefined" id="profile" class="container">
    <div class="current-user">
      <div>
        <img class="sideIcons" src="../assets/profileEloIcon.svg" alt="" />
        <h3>{{ currentUser?.elo }}</h3>
      </div>
      <div>
        <img class="border-gold user-image" :src="User.getAvatar(currentUser)" alt="" />
        <h3 class="playerName">{{ currentUser?.nickname }}</h3>
      </div>
      <div>
        <img class="sideIcons" src="../assets/profileStatusIcon.svg" alt="" />
        <h3>status</h3>
      </div>
      <!--<div class="buttons" v-if="currentUser === store.user">
		  <router-link class="test" to="/" v-on:click.prevent="logout()">
            <img :src="shutdownUrl" alt="edit" width="25" height="25" />
          </router-link>
          <router-link class="test" to="/edit">
			  <img :src="editUrl" alt="shutdown" width="25" height="25" />
			</router-link>
        </div>-->
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
      <button class="button pulse" @click="invite()">Add Friend</button>
    </div>
    <div v-if="currentUser === store.user" class="invitations" :style="toogleMenu ? 'display: none' : ''">
      <h2 v-if="store.user?.invitations?.length">Invitations</h2>
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
  <!-- <friend-alert :requester-name="incomingFriendRequest" /> -->
</template>

<script lang="ts" setup>
import FriendCard from "@/components/profile/FriendCard.vue";
import InvitationCard from "@/components/profile/InvitationCard.vue";
import SummaryCard from "@/components/profile/SummaryCard.vue";
import { fetchJSONDatas } from "@/functions/funcs";
import { useStore } from "@/store";
import { History } from "@/types/GameSummary";
import { getUserByNickname, User } from "@/types/User";
import { functionExpression } from "@babel/types";
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import editUrl from "../assets/edit.png";
import shutdownUrl from "../assets/shutdown.png";
let funcs = require("../functions/funcs");

const route = useRoute();

const store = useStore();
let socket = store.socket;

store.$subscribe((mutation, state) => {
  socket = state.socket;
});

// const prop = defineProps<{
//   incomingFriendRequest: string;
// }>();
// const emit = defineEmits<{
//   (e: "notification", enable: boolean): void;
//   (e: "updateInvitations"): void;
// }>();
// const checkNotificationBadge = () => {
//   if (store.user?.invitations?.length === 0) emit("notification", false);
// };

const searchFriend = ref("");
const toogleMenu = ref(false);

const currentUser = ref<User>();
const currentFriend = ref<User[]>();
const currentSummary = ref<History[]>();

onMounted(async () => {
  let nick = <string | undefined>route.params.nickname;

  if (nick) {
    currentUser.value = await getUserByNickname(nick).catch((err) => {
      return undefined;
    });
    console.log(currentUser.value);

    if (!currentUser.value) return;
    await fetch("http://" + window.location.hostname + ":3000/api/friendship/profile/" + nick, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    })
      .then((data) => {
        return data.json();
      })
      .then((data) => {
        currentFriend.value = data.friends;
      });
  } else {
    currentUser.value = store.user;
    currentFriend.value = store.user?.friends;
    store.$subscribe((mutation, state) => {
      currentUser.value = state.user;
      currentFriend.value = store.user?.friends;
    });
  }

  await fetch("http://" + window.location.hostname + ":3000/api/profile/summary/" + currentUser.value?.nickname, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  })
    .then((data) => data.json())
    .then((data) => {
      console.log(data);
      currentSummary.value = data;
    });
});

const watchFriend = () => {
  toogleMenu.value = false;
};

const watchHistory = () => {
  toogleMenu.value = true;
};

const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  socket?.emit("disco", {});
  socket?.close();
};

const invite = async () => {
  if (searchFriend.value.length <= 0) return;

  await fetchJSONDatas("api/friendship/invite", "POST", { addressee: searchFriend.value }).catch((err) => {
    console.log(err);
  });
  searchFriend.value = "";
};
</script>
