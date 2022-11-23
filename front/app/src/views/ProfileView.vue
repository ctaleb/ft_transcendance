<template @update-invitations="getRelations()">
  <section v-if="currentUser !== undefined" id="profile" class="container">
    <div class="current-user border-gold">
      <div>
        <img class="border-gold user-image" :src="getUserAvatar(currentUser)" alt="" />
      </div>
      <div>
        <h2 class="playerName">{{ currentUser?.nickname }}</h2>
        <h4>elo : 1500</h4>
      </div>
      <div>
        <div class="buttons" v-if="currentUser === store.user">
          <router-link class="test" to="/" v-on:click.prevent="logout()">
            <img :src="shutdownUrl" alt="edit" />
          </router-link>
          <router-link class="test" to="/edit">
            <img :src="editUrl" alt="shutdown" />
          </router-link>
        </div>
      </div>
    </div>
    <div class="subMenu">
      <button @click="watchFriend()">Friend</button>
      <button @click="watchHistory()">Match History</button>
    </div>
    <div class="search" :style="toogleMenu ? 'display: none' : ''">
      <div class="searchBar">
        <div class="searchIcon"><i class="gg-search"></i></div>
        <input type="text" class="searchField" name="searchFriend" v-model="searchFriend" placeholder="Player name" />
      </div>
      <button @click="invite()">Add Friend</button>
    </div>
    <div v-if="currentUser === store.user" class="invitations" :style="toogleMenu ? 'display: none' : ''">
      <h2 v-if="store.invitations?.length">Invitations</h2>
      <ul>
        <InvitationCard v-for="invitation of store.invitations" :invitation="invitation" />
      </ul>
    </div>
    <h2 style="margin: 1rem" :style="toogleMenu ? 'display: none' : ''">Friends</h2>
    <div class="friends" :style="toogleMenu ? 'display: none' : ''">
      <ul>
        <FriendCard v-for="friend of currentFriend" :friend="friend" />
      </ul>
    </div>
    <div class="summary" :style="toogleMenu ? '' : 'display: none'">
      <h2 style="margin: 1rem">Match History</h2>
      <ul>
        <SummaryCard v-for="summary of currentSummary" :summary="summary" />
      </ul>
    </div>
  </section>
  <h4 v-else>User not found T_T</h4>
  <!-- <friend-alert :requester-name="incomingFriendRequest" /> -->
</template>

<script lang="ts" setup>
import FriendCard from "@/components/profile/FriendCard.vue";
import InvitationCard from "@/components/profile/InvitationCard.vue";
import SummaryCard from "@/components/profile/SummaryCard.vue";
import { getUserAvatar } from "@/functions/funcs";
import { useStore } from "@/store";
import { History } from "@/types/GameSummary";
import { getUserByNickname, User } from "@/types/User";
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import editUrl from "../assets/edit.png";
import shutdownUrl from "../assets/shutdown.png";

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
//   if (store.invitations?.length === 0) emit("notification", false);
// };

const searchFriend = ref("");
const toogleMenu = ref(false);

const currentUser = ref<User>();
const currentFriend = ref<User[]>();
const currentSummary = ref<History[]>();

onMounted(async () => {
  let nick = <string | undefined>route.params.nickname;

  if (nick) {
    currentUser.value = await getUserByNickname(nick);

    if (!currentUser.value) return;
    await fetch("http://" + window.location.hostname + ":3000/api/friendship/profile/" + nick, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    })
      .then((data) => data.json())
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

const invite = () => {
  if (searchFriend.value.length <= 0) return;

  fetch("http://" + window.location.hostname + ":3000/api/friendship/invite", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
    body: JSON.stringify({
      addressee: searchFriend.value,
    }),
  })
    .then((res) => {
      if (res.status !== 200) {
        throw res.statusText;
      }
    })
    .catch((err) => console.log(err));
  searchFriend.value = "";
};
</script>
