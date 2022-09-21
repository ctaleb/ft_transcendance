<template>
  <div v-if="user != null">
    <p>Hello {{ user.nickname }} !</p>
    <p>Created at {{ user.createdAt }}</p>
    <p>Updated at {{ user.updatedAt }}</p>
    <img :src="image" alt="" style="max-width: 450px; max-height: 300px" />
    <friend-component :userId="user['id']" />
  </div>
  <p v-else>User = null</p>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import FriendComponent from "../components/FriendComponent.vue";
let funcs = require("../functions/funcs");

export default defineComponent({
  data() {
    return {
      user: JSON.parse(localStorage.getItem("user") || "{}"),
      avatar: "{}",
      image: "",
    };
  },

  mounted() {
    let isConnected = funcs.isConnected(localStorage.getItem("token"));
    if (isConnected == false) this.$router.push("/");
    else {
      funcs.getUserById(this.user.id).then((data: any) => {
        this.avatar = data.path;
        funcs.getUserAvatar(this.avatar).then((data: any) => {
          this.image = URL.createObjectURL(data);
        });
      });
    }
  },
});
</script>
