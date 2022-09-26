<template>
  <div v-if="user != null">
    <p>Hello {{ user.nickname }} !</p>
    <p>Created at {{ user.createdAt }}</p>
    <p>Updated at {{ user.updatedAt }}</p>
    <img :src="image" alt="" style="max-width: 450px; max-height: 300px" />
    <div>
      <h3>Invitations:</h3>
      <ul>
        <li v-for="invitation in invitations">
          <p>{{ invitation.nickname }}</p>
          <img
            :src="invitation.image"
            alt=""
            style="max-width: 250px; max-height: 200px"
          />
        </li>
      </ul>
      <h3>Friends:</h3>
      <ul>
        <li v-for="friend in friends">
          <p>{{ friend.nickname }}</p>
          <img
            :src="friend.image"
            alt=""
            style="max-width: 250px; max-height: 200px"
          />
        </li>
      </ul>
    </div>
  </div>
  <p v-else>User = null</p>
</template>

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
      fetch("http://localhost:3000/api/friendship/" + this.user.nickname, {
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
