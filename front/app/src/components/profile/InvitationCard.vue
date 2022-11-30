<template>
  <li>
    <section class="invitation">
      <div class="top-buttons">
        <div @click="watchProfile()" class="square left"></div>
        <div @click="block(invitation)" class="border-gold square right"></div>
      </div>
      <div class="user-invite border-gold">
        <img class="user-image border-gold" :src="User.getAvatar(invitation)" alt="" />
        <h3>{{ invitation.nickname }}</h3>
        <!-- <p>{{ "status" }}</p> -->
      </div>
      <div class="bot-buttons">
        <div @click="decline(invitation)" class="border-gold left"></div>
        <div @click="befriend(invitation)" class="border-gold right"></div>
      </div>
      <!-- <button @click="block(invitation)">Block</button>
      <button @click="watchProfile()">Profile</button>
      <button @click="decline(invitation)">Deny</button>
      <button @click="befriend(invitation)">Accept</button> -->
    </section>
  </li>
</template>

<script lang="ts" setup>
import { fetchJSONDatas } from "@/functions/funcs";
import { useStore } from "@/store";
import { User } from "@/types/User";
import { useRouter } from "vue-router";

const props = defineProps<{
  invitation: User;
}>();

const router = useRouter();
const store = useStore();

const watchProfile = () => {
  router.push("/profile/" + props.invitation.nickname);
};

const befriend = async (invitation: User) => {
  await fetchJSONDatas("api/friendship/befriend", "PUT", {
    addressee: invitation.nickname,
  })
    .then(() => {
      store.user?.invitations?.splice(store.user?.invitations?.indexOf(invitation), 1);
      store.user?.friends?.push(invitation);
    })
    .catch(() => {});
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
      store.user?.invitations?.splice(store.user?.invitations?.indexOf(invitation), 1);
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
      store.user?.invitations?.splice(store.user?.invitations?.indexOf(invitation), 1);
      // checkNotificationBadge();
    })
    .catch((err) => console.log(err));
};
</script>

<style lang="scss"></style>
