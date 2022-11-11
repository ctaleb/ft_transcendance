<template>
  <li class="friend debug-border">
    <div>
      <img class="user-image border-gold" :src="getUserAvatar(friend)" alt="" />
      <button @click="unfriend()">Remove</button>
      <button @click="watchProfile()">Profile</button>
      <button @click="spectateGame(friend.nickname)">Spectate</button>
      <button @click="inviteCustom(friend.nickname)">Invite</button>
    </div>
    <h3>{{ friend.nickname }}</h3>
  </li>
</template>

<script lang="ts" setup>
import { getUserAvatar } from "@/functions/funcs";
import { useStore } from "@/store";
import { User } from "@/types/GameSummary";
import { useRouter } from "vue-router";

const props = defineProps<{
  friend: User;
}>();

const router = useRouter();
const store = useStore();
let socket = store.socket;

store.$subscribe((mutation, state) => {
  socket = state.socket;
});

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
      store.user?.friends!.splice(
        store.user?.friends!.indexOf(props.friend),
        1
      );
    })
    .catch((err) => console.log(err));
  console.log(props.friend.nickname);
};

const watchProfile = () => {
  router.push("/profile/" + props.friend.nickname);
};

const spectateGame = (friendName: string) => {
  socket?.emit("spectate", { friend: friendName }, (response: string) => {
    if (response == "ingame") {
      router.push("game");
      socket?.emit("readySpectate", { friend: friendName });
    }
  });
};

const inviteCustom = (friendName: string) => {
  let accepted = "yes";
  socket?.emit("customInvite", { friend: friendName }, (response: string) => {
    if (response != "accepted") {
      accepted = "no";
    }
  });
  if (accepted === "no") return;
  router.push("game");
  socket?.emit("settingsInviter", { friend: friendName });
};
</script>

<style lang="scss"></style>
