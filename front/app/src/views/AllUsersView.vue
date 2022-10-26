<template>
  <div v-for="user in users" :key="user['id']">
    <UserCardComponent :nick="user['nickname']" />
  </div>
  <friend-alert :requester-name="this.incomingFriendRequest" />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import UserCardComponent from "../components/userCardComponent.vue";
import FriendAlert from "../components/FriendAlert.vue";
let funcs = require("../functions/funcs");

export default defineComponent({
  components: {
    UserCardComponent,
    FriendAlert,
  },
  props: ['incomingFriendRequest'],
  data() {
    return {
      users: [],
    };
  },
  emits: ["notification"],
  mounted() {
    fetch("http://" + window.location.hostname + ":3000/api/user/", {
      method: "GET",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    })
      .then((res) => res.json())
      .then((data) => {
        this.users = data;
      })
      .catch((err) => console.log(err.message));
  },
});
</script>
