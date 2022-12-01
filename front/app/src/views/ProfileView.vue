<template @update-invitations="getRelations()">
  <section v-if="currentUser !== undefined" id="profile" class="container">
    <div class="current-user border-gold">
      <div>
        <img class="border-gold user-image" :src="User.getAvatar(currentUser)" alt="" />
      </div>
      <div>
        <h2 class="playerName">{{ currentUser?.nickname }}</h2>
        <h4 style="text-align: center">elo : {{ currentUser?.elo }}</h4>
        <h4 style="text-align: center">status : {{ currentUser?.status }}</h4>
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
        <div v-else class="buttonProfile">
          <button class="invite" @click="invite(currentUser)">Friend Request</button>
          <button v-if="currentUserIsBlocked == false" class="block" @click="block(currentUser)">Block</button>
          <button v-else class="block" @click="unblock(currentUser)">Unblock</button>
          <button class="play" @click="">Invite/spectate</button>
          <button v-if="!hideMEe" @contextmenu.prevent="hideME()">TEST</button>
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
      <button @click="router.push('/profile/' + searchFriend)">Search Profile</button>
    </div>
    <div v-if="currentUser === store.user" class="invitations" :style="toogleMenu ? 'display: none' : ''">
      <h2 v-if="store.user?.invitations?.length">Invitations</h2>
      <ul>
        <InvitationCard v-for="invitation of store.user?.invitations" :invitation="invitation" />
      </ul>
    </div>
    <h2 style="margin: 1rem" :style="toogleMenu ? 'display: none' : ''">Friends</h2>
    <div class="friends" :style="toogleMenu ? 'display: none' : ''">
      <ul>
        <FriendCard v-for="friend of currentFriend" :friend="friend" :currentUser="currentUser" />
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
import { fetchJSONDatas } from "@/functions/funcs";
import { socketLocal, useStore } from "@/store";
import { History } from "@/types/GameSummary";
import { getUserByNickname, User } from "@/types/User";
import { onMounted, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import editUrl from "../assets/edit.png";
import shutdownUrl from "../assets/shutdown.png";

const router = useRouter();
const route = useRoute();

const store = useStore();

const searchFriend = ref("");
const toogleMenu = ref(false);

const currentUserIsBlocked = ref(false);
const currentUser = ref<User>();
const currentFriend = ref<User[]>();
const currentSummary = ref<History[]>();

const hideMEe = ref(false);

onMounted(async () => {
  let nick = <string | undefined>route.params.nickname;

  watch(
    () => currentUser.value,
    () => {
      fetchJSONDatas("api/profile/summary/" + currentUser.value?.nickname, "GET")
        .then((data) => {
          currentSummary.value = data;
        })
        .catch(() => {});
      if (store.user?.id != currentUser.value!.id) {
        fetchJSONDatas(`api/friendship/isBlocked/${currentUser.value?.id}`, "GET")
          .then((data) => {
            currentUserIsBlocked.value = data;
          })
          .catch(() => {});
      }
    }
  );

  if (nick) {
    currentUser.value = await getUserByNickname(nick);

    if (!currentUser.value) return;
    await fetchJSONDatas("api/friendship/profile/" + nick, "GET")
      .then((data) => {
        currentFriend.value = data.friends;
      })
      .catch(() => {});
  } else {
    currentUser.value = store.user;
    currentFriend.value = store.user?.friends;
    store.$subscribe((mutation, state) => {
      currentUser.value = state.user;
      currentFriend.value = store.user?.friends;
    });
  }

  // fetchJSONDatas("api/profile/summary/" + currentUser.value?.nickname, "GET")
  //   .then((data) => {
  //     currentUserIsBlocked.value = data;
  //   })
  //   .catch(() => {});
  // if (store.user?.id != currentUser.value!.id)
  //   fetchJSONDatas("api/riendship/isBlocked/" + currentUser.value?.id, "GET")
  //     .then((data) => {
  //       currentSummary.value = data;
  //     })
  //     .catch(() => {});
});

const hideME = () => {
  hideMEe.value = true;
};

const watchFriend = () => {
  toogleMenu.value = false;
};

const watchHistory = () => {
  toogleMenu.value = true;
};

const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  socketLocal.value?.emit("disco", {});
  socketLocal.value?.close();
};

const invite = async (user: User | undefined) => {
  if (user) await fetchJSONDatas("api/friendship/invite", "POST", { addressee: user.nickname }).catch();
};

const block = async (user: User | undefined) => {
  if (user)
    await fetchJSONDatas("api/friendship/block", "PUT", { addressee: user.nickname })
      .then(() => {
        currentUserIsBlocked.value = true;
      })
      .catch();
};

const unblock = async (user: User | undefined) => {
  if (user)
    await fetchJSONDatas("api/friendship/unblock", "PUT", { addressee: user.nickname })
      .then(() => {
        currentUserIsBlocked.value = false;
      })
      .catch(() => {});
};
</script>
