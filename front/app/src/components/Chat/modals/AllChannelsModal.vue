<template>
  <div class="overlay"></div>
  <div class="modal all-chan-modal">
    <span @click="$emit('closeAllChannelsModal')" class="close-modal"><i class="gg-close-o"></i></span>
    <template v-for="channel in allChannels">
      <ChannelInModal @join-channel="(channel) => $emit('joinChannel', channel)" :channel="channel" />
    </template>
  </div>
</template>

<script setup lang="ts">
import ChannelInModal from "@/components/chat/modals/ChannelInModal.vue";
import { useStore } from "@/store";
import { Channel } from "@/types/Channel";
import { onMounted } from "vue";

const props = defineProps<{
  allChannels: Channel[];
}>();

const emits = defineEmits<{
  (e: "closeAllChannelsModal"): void;
  (e: "joinChannel"): void;
}>();

const store = useStore();
let socket = store.socket;

store.$subscribe((mutation, state) => {
  socket = state.socket;
});
</script>
