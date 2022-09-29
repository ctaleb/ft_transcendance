<template>
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
          placeholder="Player name"
        />
      </div>
      <button>Add Friend</button>
    </div>
    <h3>Invitations:</h3>
    <div>
      <span v-for="invitation in invitations">
        <p>{{ invitation.nickname }}</p>
        <img
          :src="invitation.image"
          alt=""
          style="max-width: 250px; max-height: 200px"
        />
        <button @click="befriend(invitation)">Accept</button>
        <button @click="decline(invitation)">Decline</button>
        <button @click="block(invitation)">Block</button>
      </span>
    </div>
    <h3>Friends:</h3>
    <div>
      <span v-for="friend in friends">
        <p>{{ friend.nickname }}</p>
        <img
          :src="friend.image"
          alt=""
          style="max-width: 250px; max-height: 200px"
        />
      </span>
    </div>
  </div>
  <p v-else>User = null</p>
</template>

<style lang="scss">
@import "../styles/profile.scss";
</style>

<script lang="ts">
import { defineComponent } from "vue";
let funcs = require("../functions/funcs");

interface User {
  nickname: string;
  path: string;
  image: string;
}

export default defineComponent({
  data() {
    return {
      user: JSON.parse(localStorage.getItem("user") || "{}"),
      image: "",
      invitations: Array<User>(),
      friends: Array<User>(),
    };
  },

  methods: {
    getRelations() {
      fetch(
        "http://" +
          window.location.hostname +
          ":3000/api/friendship/" +
          this.user.nickname,
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
          this.invitations = data.invitations;
          this.friends = data.friends;
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

    befriend(invitation: User) {
      fetch(
        "http://" + window.location.hostname + ":3000/api/friendship/befriend",
        {
          method: "PUT",
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
          body: JSON.stringify({
            requester: this.user.nickname,
            addressee: invitation.nickname,
          }),
        }
      )
        .then((res) => {
          if (res.status !== 201) {
            throw res.statusText;
          }
          return res.json();
        })
        .then((data) => {
          this.invitations.splice(this.invitations.indexOf(invitation), 1);
          this.friends.push(invitation);
        })
        .catch((err) => console.log(err));
    },
  },

  mounted() {
    let isConnected = funcs.isConnected(localStorage.getItem("token"));
    if (isConnected == false) this.$router.push("/");
    else {
      funcs.getUserById(this.user.id).then((data: any) => {
        funcs.getUserAvatar(data.path).then((data: any) => {
          this.image = URL.createObjectURL(data);
        });
      });
      this.getRelations();
    }
  },
});
</script>
