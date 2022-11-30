<template>
  <div v-if="store.currentChat !== undefined" class="chat-window">
    <ChatWindowHeader @toggle-channel-info="toggleChannelInfo()" />
    <div class="chat-body">
      <ChatArea />
      <ChannelInfo v-if="showChannelInfo && isChannel(store.currentChat)" @update-channels-list="$emit('updateChannelsList')" />
    </div>
  </div>
  <div v-else class="default-chat-window">
    <h2>Welcome to the chat</h2>
  </div>
</template>

<script setup lang="ts">
import ChatWindowHeader from "@/components/chat/ChatWindowHeader.vue";
import ChannelInfo from "@/components/chat/ChannelInfo.vue";
import ChatArea from "@/components/chat/ChatArea.vue";
import { useStore } from "@/store";
import { isChannel } from "@/types/Channel";
import { ref } from "vue";

const store = useStore();

const emits = defineEmits<{
  (e: "updateChannelsList"): void;
}>();

const showChannelInfo = ref(false);

const toggleChannelInfo = () => {
  showChannelInfo.value = !showChannelInfo.value;
};
</script>
