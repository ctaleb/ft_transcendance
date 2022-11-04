<template @update-invitations="getRelations()">
  <div @notif-chat="openChatNotif" class="hidden"></div>
  <div v-if="user != null" class="profileView">
    <p>Hello {{ user.nickname }} !</p>
    <p>Created at {{ user.createdAt }}</p>
    <p>Updated at {{ user.updatedAt }}</p>
    <img :src="image" alt="" style="max-width: 450px; max-height: 300px" />
    <div class="search">
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
    <h1 v-if="invitations.length">Invitations:</h1>
    <div class="invitations">
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
    <h1 v-if="friends.length">Friends:</h1>
    <div class="friends">
      <span class="friend" v-for="friend in friends">
        <div class="image">
          <img :src="friend.image" alt="" />
          <button @click="unfriend(friend)">
            <i class="gg-more-vertical-o"></i>
          </button>
        </div>
        <p>{{ friend.nickname }}</p>
        <button style="color: white" @click="displayPrivateConv(friend)">
          Chat
        </button>
        <button style="color: white" @click="watchProfile(friend)">
          Profile
        </button>
        <button style="color: white" @click="">Spectate</button>
        <button style="color: white" @click="">Invite</button>
      </span>
    </div>
  </div>
  <p v-else>User = null</p>
  <div v-for="friend in conversations">
    <div v-if="friend.displayChatWindow == true">
      <chat-window
        :dest-nickname="friend.nickname"
        @close-window="closePrivateConv"
      />
    </div>
  </div>

  <friend-alert
    :requester-name="incomingFriendRequest"
    @update-invitations="getRelations()"
  />
</template>

<style lang="scss">
@import "../styles/profile.scss";
</style>

<script lang="ts">
import { ref, defineComponent } from "vue";
let funcs = require("../functions/funcs");
import FriendAlert from "../components/FriendAlert.vue";
import chatWindow from "../components/chatWindow.vue";
import config from "../config/config";

const socket = config.socket;

interface User {
  nickname: string;
  path: string;
  image: string;
}

interface History {
  host: User;
  hostScore: number;
  hostPower: string;
  hostElo: number;
  client: User;
  clientScore: number;
  clientPower: string;
  clientElo: number;
  eloChange: number;
  gameMode: string;
}

export default defineComponent({
  props: ["incomingFriendRequest"],
  data() {
    return {
      user: JSON.parse(localStorage.getItem("user") || "{}"),
      image: "",
      invitations: Array<User>(),
      friends: Array<User>(),
      matchHistory: Array<History>(),
      searchFriend: "",
      privateMessage: "",
      conversations: Array<{ nickname: string; displayChatWindow: Boolean }>(),
    };
  },
  emits: [
    "notification",
    "updateInvitations",
    "createPrivateConv",
    "closeWindow",
  ],
  methods: {
    getRelations() {
      fetch("http://" + window.location.hostname + ":3000/api/friendship", {
        method: "GET",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      })
        .then((res) => {
          return res.json();
        })
        .then((data) => {
          this.invitations = data.invitations;
          this.friends = data.friends;
          this.fillConversations();
          console.log(this.friends);
          for (let invitation of this.invitations) {
            funcs.getUserAvatar(invitation.path).then((data: any) => {
              invitation.image = URL.createObjectURL(data);
            });
          }
          for (let friend of this.friends) {
            funcs.getUserAvatar(friend.path).then((data: any) => {
              friend.image = URL.createObjectURL(data);
            });
          }
        })
        .catch((err) => console.log(err.message));
    },
    getMatchHistory(name: string) {
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
    },

    checkNotificationBadge() {
      if (this.invitations.length === 0) this.$emit("notification", false);
    },

    invite() {
      if (this.searchFriend.length <= 0) return;
      fetch(
        "http://" + window.location.hostname + ":3000/api/friendship/invite",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
          body: JSON.stringify({
            addressee: this.searchFriend,
          }),
        }
      )
        .then((res) => {
          if (res.status !== 200) {
            throw res.statusText;
          }
        })
        .catch((err) => console.log(err));
      this.searchFriend = "";
    },

    befriend(invitation: User) {
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
    },

    decline(invitation: User) {
      fetch(
        "http://" + window.location.hostname + ":3000/api/friendship/decline",
        {
          method: "DELETE",
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
          this.checkNotificationBadge();
        })
        .catch((err) => console.log(err));
    },

    block(invitation: User) {
      fetch(
        "http://" + window.location.hostname + ":3000/api/friendship/block",
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
          this.checkNotificationBadge();
        })
        .catch((err) => console.log(err));
    },

    unfriend(friend: User) {
      fetch(
        "http://" + window.location.hostname + ":3000/api/friendship/unfriend",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
          body: JSON.stringify({
            addressee: friend.nickname,
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
          this.friends.splice(this.friends.indexOf(friend), 1);
        })
        .catch((err) => console.log(err));
    },
    displayPrivateConv(friend: User) {
      this.conversations.forEach((conv) => {
        if (conv.nickname === friend.nickname) conv.displayChatWindow = true;
      });
    },
    watchProfile(friend: User) {
      this.$router.push("profile/" + friend.nickname);
    },
    closePrivateConv(nickname: string) {
      this.conversations.forEach((conv) => {
        if (conv.nickname === nickname) conv.displayChatWindow = false;
      });
    },

    fillConversations() {
      this.friends.forEach((friend) => {
        let initConv = {
          nickname: friend.nickname,
          displayChatWindow: false,
        };
        this.conversations.push(initConv);
      });
    },
    openChatNotif(payload: string) {
      this.conversations.forEach((conv) => {
        if (conv.nickname === payload) conv.displayChatWindow = true;
      });
    },
  },

  mounted() {
    let nick: string = <string>this.$route.params.nickname;
    if (!nick) {
      socket.on("openChatWindow", (payload: { author: string }) => {
        this.conversations.forEach((conv) => {
          if (conv.nickname === payload.author) conv.displayChatWindow = true;
        });
      });
      funcs.getUserByNickname(this.user.nickname).then((data: any) => {
        nick = data.nickname;
        this.user = data;
        funcs.getUserAvatar(data.avatar.path).then((data: any) => {
          this.image = URL.createObjectURL(data);
        });
      });
      this.getRelations();
    } else {
      funcs.getUserByNickname(nick).then((data: any) => {
        this.user = data;
        funcs.getUserAvatar(data.avatar.path).then((data: any) => {
          this.image = URL.createObjectURL(data);
        });
      });
    }
    this.getMatchHistory(nick);
  },
  components: { FriendAlert, chatWindow },
});
</script>
