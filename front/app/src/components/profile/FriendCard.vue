<template>
  <li class="friend debug-border">
    <img width="300" height="300" class="user-image border-gold" :src="getUserAvatar(friend)" alt="" />
    <h3>{{ friend.nickname }}</h3>
    <button @click="unfriend()">Remove</button>
    <button @click="watchProfile()">Profile</button>
    <button @click="spectateGame()">Spectate</button>
    <button @click="inviteCustom()">Invite</button>
  </li>
</template>

<script lang="ts" setup>
import { getUserAvatar } from "@/functions/funcs";
import { User } from "@/types/GameSummary";
import { useRouter } from "vue-router";

const props = defineProps<{
  friend: User;
}>();

const router = useRouter();

const unfriend = () => {
  fetch(
    "http://" + window.location.hostname + ":3000/api/friendship/unfriend",
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify({
        addressee: props.friend.nickname,
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
      // friends.splice(friends.indexOf(friend), 1);
    })
    .catch((err) => console.log(err));
};

const watchProfile = () => {
  router.push("/profile/" + props.friend.nickname);
};

const spectateGame = () => {
  router.push("game");
};

const inviteCustom = () => {
  router.push("game");
};
</script>

<style lang="scss"></style>
