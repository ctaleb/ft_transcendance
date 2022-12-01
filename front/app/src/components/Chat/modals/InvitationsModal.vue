<template>
  <div class="overlay"></div>
  <div class="modal all-chan-modal">
    <span @click="$emit('closeInvitationsModal')" class="close-modal"><i class="gg-close-o"></i></span>
    <template v-for="channel in invitations">
      <ChannelInModal
        @join-channel="(channel) => $emit('joinPrivateChannel', channel)"
        @decline-invitation="(channel) => $emit('declineInvitation', channel)"
        :channel="channel"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import ChannelInModal from "@/components/chat/modals/ChannelInModal.vue";
import { useStore } from "@/store";
import { Channel } from "@/types/Channel";
import { onMounted } from "vue";

const props = defineProps<{
  invitations: Channel[];
}>();

const emits = defineEmits<{
  (e: "closeInvitationsModal"): void;
  (e: "joinPrivateChannel"): void;
  (e: "declineInvitation"): void;
}>();

const store = useStore();
let socket = store.socket;

store.$subscribe((mutation, state) => {
  socket = state.socket;
});
</script>
