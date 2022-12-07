<template>
  <div class="overlay"></div>
  <div class="modal all-chan-modal">
    <span @click="$emit('closeInvitationsModal')" class="close-modal"><i class="gg-close-o"></i></span>
    <h2 v-if="channelInvitations.length == 0">No invitations yet</h2>
    <template v-for="channel in channelInvitations">
      <ChannelInModal @join-channel="(channel) => $emit('joinPrivateChannel', channel)" @decline-invitation="declineInvitation" :channel="channel" />
    </template>
  </div>
</template>

<script setup lang="ts">
import ChannelInModal from "@/components/chat/modals/ChannelInModal.vue";
import { fetchJSONDatas } from "@/functions/funcs";
import { useStore } from "@/store";
import { Channel } from "@/types/Channel";
import { onMounted, ref, Ref } from "vue";

const emits = defineEmits<{
  (e: "closeInvitationsModal"): void;
  (e: "joinPrivateChannel"): void;
  (e: "declineInvitation"): void;
}>();

const store = useStore();
let socket = store.socket;

const channelInvitations: Ref<Array<Channel>> = ref([]);

const getChannelInvitations = async (): Promise<void> => {
  await fetchJSONDatas("api/chat/invitations", "GET")
    .then((data) => {
      channelInvitations.value = data;
    })
    .catch(() => {});
};

const declineInvitation = (channel: Channel) => {
  channelInvitations.value.splice(channelInvitations.value.indexOf(channel), 1);
};

store.$subscribe((mutation, state) => {
  socket = state.socket;
});

onMounted(() => {
  getChannelInvitations();
});
</script>
