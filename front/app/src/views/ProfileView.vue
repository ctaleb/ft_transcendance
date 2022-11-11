<template @update-invitations="getRelations()">
  <section v-if="currentUser !== undefined" id="profile" class="container">
    <div class="current-user debug-border">
      <img
        class="user-image border-gold"
        :src="getUserAvatar(currentUser)"
        alt=""
        width="300"
        height="300"
      />
      <div>
        <h2 class="playerName">{{ currentUser?.nickname }}</h2>
        <div v-if="currentUser === store.user">
          <router-link to="/edit">Profile Editing</router-link>
          |
          <router-link to="/" v-on:click.prevent="logout()">Logout</router-link>
        </div>
      </div>
    </div>
    <div class="search debug-border">
      <div class="searchBar">
        <div class="searchIcon"><i class="gg-search"></i></div>
        <input
          type="text"
          class="searchField"
          name="searchFriend"
          v-model="searchFriend"
          placeholder="Player name"
        />
      </div>
      <button @click="invite()">Add Friend</button>
    </div>
    <div v-if="currentUser === store.user" class="friends debug-border">
      <h2 v-if="store.invitations?.length">Invitations</h2>
      <ul>
        <InvitationCard
          v-for="invitation of store.invitations"
          :invitation="invitation"
        />
      </ul>
    </div>
    <div class="friends debug-border">
      <h2>Friends</h2>
      <ul>
        <FriendCard v-for="friend of store.user?.friends" :friend="friend" />
      </ul>
    </div>
  </section>
  <h4 v-else>User not found T_T</h4>
  <!-- <friend-alert :requester-name="incomingFriendRequest" /> -->
</template>

<script lang="ts" setup>
import FriendAlert from "@/components/FriendAlert.vue";
import FriendCard from "@/components/profile/FriendCard.vue";
import InvitationCard from "@/components/profile/InvitationCard.vue";
import { getUserAvatar, getUserByNickname } from "@/functions/funcs";
import { useStore } from "@/store";
import { User } from "@/types/GameSummary";
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
//import config from "@/config/config";

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

const currentUser = ref<User>();
const currentFriend = ref<User[]>();

onMounted(async () => {
  let nick = <string | undefined>route.params.nickname;

  if (nick) {
    currentUser.value = await getUserByNickname(nick);
    console.log(currentUser.value);

    if (!currentUser.value) return;
    await fetch("http://" + window.location.hostname + ":3000/api/friendship", {
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
    });
  }
});

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

<style lang="scss">
@import "../styles/profile.scss";
</style>
