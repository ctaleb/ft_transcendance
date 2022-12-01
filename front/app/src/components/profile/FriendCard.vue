<template>
  <li class="friend border-gold">
    <div>
      <img class="user-image" :src="User.getAvatar(friend)" alt="" />
      <button v-if="currentUser == store.user" @click="unfriend()">Remove</button>
      <button @click="watchProfile()">Profile</button>
      <button v-if="friend.status == 'inGame'" @click="spectateGame(friend.nickname)">Spectate</button>
      <button v-if="friend.status == 'online'" @click="inviteCustom(friend.nickname)">Invite</button>
    </div>
    <h3 style="margin: 10px">{{ friend.nickname }}</h3>
    <h4 style="color: greenyellow; text-align: center">{{ friend.status }}</h4>
  </li>
</template>

<script lang="ts" setup>
import { socketLocal, useStore } from "@/store";
import { User } from "@/types/User";
import { useRouter } from "vue-router";

const props = defineProps<{
  friend: User;
  currentUser: User;
}>();

const router = useRouter();
const store = useStore();

const unfriend = () => {
  fetch("http://" + window.location.hostname + ":3000/api/friendship/unfriend", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
    body: JSON.stringify({
      addressee: props.friend.nickname,
    }),
  })
    .then((res) => {
      if (res.status !== 200) {
        throw res.statusText;
      }
      return res.json();
    })
    .then((data) => {
      store.user?.friends!.splice(store.user?.friends!.indexOf(props.friend), 1);
    })
    .catch((err) => console.log(err));
  console.log(props.friend.nickname);
};

const watchProfile = () => {
  router.push("/profile/" + props.friend.nickname);
};

const spectateGame = (friendName: string) => {
  socketLocal.value?.emit("spectate", { friend: friendName }, (response: string) => {
    if (response == "ingame") {
      router.push("game");
      socketLocal.value?.emit("readySpectate", { friend: friendName });
    }
  });
};

const inviteCustom = (friendName: string) => {
  let accepted = "yes";
  socketLocal.value?.emit("customInvite", { friend: friendName }, (response: string) => {
    if (response != "accepted") {
      accepted = "no";
    }
  });
  if (accepted === "no") return;
  router.push("game");
  socketLocal.value?.emit("settingsInviter", { friend: friendName });
};
</script>

<style lang="scss"></style>
