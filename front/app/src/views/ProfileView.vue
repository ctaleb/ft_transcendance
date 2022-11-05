<template @update-invitations="getRelations()">
  <div @notif-chat="openChatNotif" class="hidden"></div>
  <section v-if="user != null" id="profile" class="container">
    <div class="current-user debug-border">
      <img
        class="user-image border-gold"
        :src="image"
        alt=""
        style="max-width: 300px; max-height: 300px"
      />
      <p class="playerName">{{ user.nickname }}</p>
    </div>
    <!-- <div class="menu">
      <button @click="">Friend</button>
      <button @click="">Match History</button>
      <button @click="">Invitations</button>
      <button @click="">Ranking</button>
    </div> -->
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
    <div class="invitations debug-border">
      <h1 v-if="invitations.length">Invitations:</h1>
      <span class="invitation" v-for="invitation in invitations">
        <img :src="invitation.image" alt="" />
        <div class="invitationInfo">
          <h2>{{ invitation.nickname }}</h2>
        </div>
        <div class="invitationAction">
          <button @click="befriend(invitation)">
            <i class="gg-check"></i>
          </button>
          <button @click="decline(invitation)"><i class="gg-close"></i></button>
          <button @click="block(invitation)"><i class="gg-block"></i></button>
        </div>
      </span>
    </div>
    <div class="friends debug-border">
      <h2>Friends</h2>
      <ul>
        <FriendCard v-for="friend of friends" :friend="friend" />
      </ul>
    </div>
  </section>
  <p v-else>User = null</p>
  <friend-alert
    :requester-name="incomingFriendRequest"
    @update-invitations="getRelations()"
  />
</template>

<script lang="ts" setup>
import FriendAlert from "@/components/FriendAlert.vue";
import FriendCard from "@/components/profile/FriendCard.vue";
import config from "@/config/config";
import * as funcs from "@/functions/funcs";
import { User } from "@/types/GameSummary";
import { reactive, ref } from "vue";
import { useRoute } from "vue-router";

const socket = config.socket;
const route = useRoute();

const props = defineProps<{
  incomingFriendRequest: string;
}>();

const emit = defineEmits<{
  (e: "notification", enable: boolean): void;
  (e: "updateInvitations"): void;
}>();

const user = reactive<User>(JSON.parse(localStorage.getItem("user") || "{}"));
const image = ref("");
const searchFriend = ref("");

const getMatchHistory = (name: string) => {
  fetch(
    "http://" +
      window.location.hostname +
      ":3000/api/profile/match-history/" +
      name,
    {
      method: "GET",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    }
  )
    .then((res) => {
      return res.json();
    })
    .then((data) => {
      this.matchHistory = data;
    })
    .catch((err) => console.log(err.message));
};

const checkNotificationBadge = () => {
  if (this.invitations.length === 0) this.$emit("notification", false);
};

const invite = () => {
  if (this.searchFriend.length <= 0) return;
  fetch("http://" + window.location.hostname + ":3000/api/friendship/invite", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
    body: JSON.stringify({
      addressee: this.searchFriend,
    }),
  })
    .then((res) => {
      if (res.status !== 200) {
        throw res.statusText;
      }
    })
    .catch((err) => console.log(err));
  this.searchFriend = "";
};

const befriend = (invitation: User) => {
  fetch(
    "http://" + window.location.hostname + ":3000/api/friendship/befriend",
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify({
        addressee: invitation.nickname,
      }),
    }
  )
    .then((res) => {
      if (res.status !== 200) {
        throw res.statusText;
      }
      return res.json();
    })
    .then((data) => {
      this.invitations.splice(this.invitations.indexOf(invitation), 1);
      this.friends.push(invitation);
      this.checkNotificationBadge();
    })
    .catch((err) => console.log(err));
};

const decline = (invitation: User) => {
  fetch("http://" + window.location.hostname + ":3000/api/friendship/decline", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
    body: JSON.stringify({
      addressee: invitation.nickname,
    }),
  })
    .then((res) => {
      if (res.status !== 200) {
        throw res.statusText;
      }
      return res.json();
    })
    .then((data) => {
      this.invitations.splice(this.invitations.indexOf(invitation), 1);
      this.checkNotificationBadge();
    })
    .catch((err) => console.log(err));
};

const block = (invitation: User) => {
  fetch("http://" + window.location.hostname + ":3000/api/friendship/block", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
    body: JSON.stringify({
      addressee: invitation.nickname,
    }),
  })
    .then((res) => {
      if (res.status !== 200) {
        throw res.statusText;
      }
      return res.json();
    })
    .then((data) => {
      this.invitations.splice(this.invitations.indexOf(invitation), 1);
      this.checkNotificationBadge();
    })
    .catch((err) => console.log(err));
};

const closePrivateConv = (nickname: string) => {
  this.conversations.forEach((conv) => {
    if (conv.nickname === nickname) conv.displayChatWindow = false;
  });
};

const fillConversations = () => {
  this.friends.forEach((friend) => {
    let initConv = {
      nickname: friend.nickname,
      displayChatWindow: false,
    };
    this.conversations.push(initConv);
  });
};

const openChatNotif = (payload: string) => {
  this.conversations.forEach((conv) => {
    if (conv.nickname === payload) conv.displayChatWindow = true;
  });
};

onMounted(() => {
  let nick: string = <string>route.params.nickname;
  if (!nick) {
    socket.on("openChatWindow", (payload: { author: string }) => {
      this.conversations.forEach((conv) => {
        if (conv.nickname === payload.author) conv.displayChatWindow = true;
      });
    });
    funcs.getUserByNickname(this.user.nickname).then((data: any) => {
      nick = data.nickname;
      this.user = data;
      this.image = funcs.getUserAvatar(data.avatar.path);
    });
    this.getRelations();
  } else {
    funcs.getUserByNickname(nick).then((data: any) => {
      this.user = data;
      this.image = funcs.getUserAvatar(data.avatar.path);
    });
  }
  this.getMatchHistory(nick);
});
</script>

<style lang="scss">
@import "../styles/profile.scss";
</style>
