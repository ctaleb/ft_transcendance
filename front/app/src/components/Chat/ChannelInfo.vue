<template>
  <div class="channel-info">
    <div class="channel-options">
      <button class="primary-btn">Leave channel</button>
      <button v-if="(<Channel>store.currentChat).type === ChannelType.PRIVATE" class="primary-btn">Invite new member</button>
    </div>
    <ChannelMembers />
  </div>
</template>

<script setup lang="ts">
import ChannelMembers from "@/components/chat/ChannelMembers.vue";
import { useStore } from "@/store";
import { Channel, ChannelType } from "@/types/Channel";
import { Conversation } from "@/types/Conversation";
import { User } from "@/types/User";
import { onMounted, onUpdated, Ref, ref } from "vue";

const store = useStore();

store.$subscribe((mutation, state) => {});

onMounted(() => {});
</script>
