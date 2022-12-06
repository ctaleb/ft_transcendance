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
        <h3 class="playerName">{{ currentUser?.nickname }} <i v-if="currentUser === store.user" class="gg-edit-markup" @click="redirectToEdit()"></i></h3>
      </div>
      <div>
        <img class="sideIcons" src="../assets/profileStatusIcon.svg" alt="" />
        <h3>{{ store.user?.status }}</h3>
      </div>
    </div>
    <div class="buttonProfile" v-if="currentUser != store.user">
      <i title="Add friend" class="gg-user-add" @click="invite(currentUser)"></i>
      <i v-if="currentUserIsBlocked == false" title="Block user" class="gg-block" @click="block(currentUser)"></i>
      <i v-else title="Unblock user" class="gg-block" @click="unblock(currentUser)"></i>
      <i title="Spectate your friend" class="gg-eye" @click=""></i>
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
      <button class="button pulse" @click="router.push('/profile/' + searchFriend)">Search Profile</button>
    </div>
    <div v-if="currentUser === store.user" class="invitations" :style="toogleMenu ? 'display: none' : ''">
      <ul>
        <InvitationCard v-for="invitation of store.user?.invitations" :invitation="invitation" />
      </ul>
    </div>
    <div class="friends" :style="toogleMenu ? 'display: none' : ''">
      <ul>
        <FriendCard v-for="friend of currentFriend" :friend="friend" :currentUser="currentUser" />
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
import { addAlertMessage, fetchJSONDatas } from "@/functions/funcs";
import { socketLocal, useStore } from "@/store";
import { History } from "@/types/GameSummary";
import { getUserByNickname, User } from "@/types/User";
import { functionExpression } from "@babel/types";
import { onMounted, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import editUrl from "../assets/edit.png";
import shutdownUrl from "../assets/shutdown.png";
import { useRouter } from "vue-router";
let funcs = require("../functions/funcs");

const router = useRouter();
const route = useRoute();

const store = useStore();

const searchFriend = ref("");
const toogleMenu = ref(false);

const currentUserIsBlocked = ref(false);
const currentUser = ref<User>();
const currentFriend = ref<User[]>();
const currentSummary = ref<History[]>();

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
    currentUser.value = await getUserByNickname(nick).catch((err) => {
      return undefined;
    });

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

  await fetch("http://" + window.location.hostname + ":3000/api/profile/summary/" + currentUser.value?.nickname, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  })
    .then((data) => data.json())
    .then((data) => {
      currentSummary.value = data;
    });
  if (store.user?.id != currentUser.value!.id) {
    fetchJSONDatas(`api/friendship/isBlocked/${currentUser.value?.id}`, "GET")
      .then((data) => {
        currentUserIsBlocked.value = data;
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

const invite = async (user: User | undefined) => {
  if (user)
    await fetchJSONDatas("api/friendship/invite", "POST", { addressee: user?.nickname })
      .then((data) => {
        socketLocal.value?.emit("friendship-invite", { id: store.user?.id, addresseeId: user?.id, target: user?.nickname, requester: store.user?.nickname });
        addAlertMessage("The user has been invited", 2);
      })
      .catch((err) => {});
};

const block = async (user: User | undefined) => {
  if (user)
    await fetchJSONDatas("api/friendship/block", "PUT", { addressee: user.nickname })
      .then(() => {
        currentUserIsBlocked.value = true;
        addAlertMessage("The user has been blocked", 2);
      })
      .catch((err) => {});
};

const unblock = async (user: User | undefined) => {
  if (user)
    await fetchJSONDatas("api/friendship/unblock", "PUT", { addressee: user.nickname })
      .then(() => {
        currentUserIsBlocked.value = false;
        addAlertMessage("The user has been unblocked", 2);
      })
      .catch((err) => {});
};

function redirectToEdit() {
  window.location.href = "/edit";
}
</script>
