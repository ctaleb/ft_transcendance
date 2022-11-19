<template>
  <li class="friend debug-border">
    <div>
      <img
        class="user-image border-gold"
        :src="getUserAvatar(invitation)"
        alt=""
      />
      <button @click="block(invitation)">Block</button>
      <button @click="watchProfile()">Profile</button>
      <button @click="decline(invitation)">Deny</button>
      <button @click="befriend(invitation)">Accept</button>
    </div>
    <h3>{{ invitation.nickname }}</h3>
  </li>
</template>

<script lang="ts" setup>
import { getUserAvatar } from "@/functions/funcs";
import { useStore } from "@/store";
import { User } from "@/types/GameSummary";
import { useRouter } from "vue-router";

const props = defineProps<{
  invitation: User;
}>();

const router = useRouter();
const store = useStore();

const watchProfile = () => {
  router.push("/profile/" + props.invitation.nickname);
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
      store.invitations?.splice(store.invitations?.indexOf(invitation), 1);
      store.user?.friends?.push(invitation);
      // checkNotificationBadge();
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
      store.invitations?.splice(store.invitations?.indexOf(invitation), 1);
      // checkNotificationBadge();
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
      store.invitations?.splice(store.invitations?.indexOf(invitation), 1);
      // checkNotificationBadge();
    })
    .catch((err) => console.log(err));
};
</script>

<style lang="scss"></style>
