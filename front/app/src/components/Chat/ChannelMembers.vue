<template>
  <div class="channel-members">
    <div v-for="member in (<Channel>store.currentChat).members">
      <img class="user-image" :src="User.getAvatar(member)" alt="" />
      <h4>{{ member.nickname }}</h4>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStore } from "@/store";
import { Channel } from "@/types/Channel";
import { Conversation } from "@/types/Conversation";
import { User } from "@/types/User";
import { onMounted, onUpdated, Ref, ref } from "vue";

const store = useStore();

onMounted(() => {
  console.log((<Channel>store.currentChat).members);
  console.log(store.user);
});
</script>
