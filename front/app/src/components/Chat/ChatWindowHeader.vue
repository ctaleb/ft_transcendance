<template>
  <div class="chat-window-header">
    <div class="chat-window-header-info">
      <div>
        <h2>{{ title }}</h2>
        <p>{{ detail }}</p>
        <p style="color: green">status</p>
      </div>
      <i class="gg-more-o" v-if="isChannel(store.currentChat!)" @click="$emit('toggleChannelInfo')"></i>
    </div>
  </div>
</template>

<script setup lang="ts">
import { State, useStore } from "@/store";
import { Channel, isChannel } from "@/types/Channel";
import { Conversation } from "@/types/Conversation";
import { onMounted, Ref, ref } from "vue";

const store = useStore();
const title: Ref<string> = ref("");
const detail: Ref<string> = ref("");

onMounted(() => {
  reloadInfos(store.$state);
});

store.$subscribe((mutation, state) => {
  reloadInfos(state);
});

const reloadInfos = (state: any) => {
  if (state.currentChat === undefined) {
    return;
  }

  title.value = isChannel(state.currentChat!) ? Channel.getName(<Channel>state.currentChat) : Conversation.getName(<Conversation>state.currentChat);
  detail.value = isChannel(state.currentChat!)
    ? `${(<Channel>state.currentChat).members!.length} members`
    : `Rank ${(<Conversation>state.currentChat).other.elo}`;
};
</script>
