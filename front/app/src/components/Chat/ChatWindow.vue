<template>
  <div class="chat-window">
    <div v-if="store.currentChat !== undefined">
      <div class="chat-window-header">
        <h2></h2>
      </div>
    </div>
    <div v-else class="default-chat-window">
      <h2>Welcome to the chat</h2>
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

onMounted(() => {});
</script>
