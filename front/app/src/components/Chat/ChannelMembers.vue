<template>
  <div class="channel-members">
    <div v-for="member in (<Channel>store.currentChat).members">
      <img class="user-image" :src="User.getAvatar(member)" alt="" />
      <h4>{{ member.nickname }}</h4>
    </div>
  </div>
</template>

<script setup lang="ts">
import { fetchJSONDatas } from "@/functions/funcs";
import { useStore } from "@/store";
import { Channel, isChannel } from "@/types/Channel";
import { Conversation } from "@/types/Conversation";
import { User } from "@/types/User";
import { onMounted, onUpdated, Ref, ref } from "vue";

const store = useStore();

let socket = store.socket;

store.$subscribe((mutation, state) => {
  socket = state.socket;
});

onMounted(() => {
  socket?.on("updateChannelMembers", async (channelId: number) => {
    if (isChannel(store.currentChat!) && channelId === store.currentChat!.id) {
      let data = await fetchJSONDatas("api/chat/members", "POST", {
        id: store.currentChat!.id,
      });
    }
  });
});
</script>
