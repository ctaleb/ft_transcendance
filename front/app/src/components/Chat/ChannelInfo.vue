<template>
  <div class="channel-info">
    <div class="channel-options">
      <button @click="leaveChannel" class="primary-btn">Leave channel</button>
      <button v-if="(<Channel>store.currentChat).type === ChannelType.PRIVATE" @click="showInviteToChannelModal = true" class="primary-btn">
        Invite new member
      </button>
    </div>
    <ChannelMembers />
  </div>
  <InviteToChannel v-if="showInviteToChannelModal" @close-invite-modal="showInviteToChannelModal = false" />
</template>

<script setup lang="ts">
import ChannelMembers from "@/components/chat/ChannelMembers.vue";
import InviteToChannel from "@/components/chat/modals/InviteToChannel.vue";
import { fetchJSONDatas } from "@/functions/funcs";
import { useStore } from "@/store";
import { Channel, ChannelType } from "@/types/Channel";
import { onMounted, ref } from "vue";

const store = useStore();
let socket = store.socket;

const emits = defineEmits<{
  (e: "updateChannelsList"): void;
  (e: "closeInviteModal"): void;
}>();

const showInviteToChannelModal = ref(false);

store.$subscribe((mutation, state) => {
  socket = state.socket;
});

const leaveChannel = async (): Promise<void> => {
  const data: Channel = await fetchJSONDatas("api/chat/leave-channel", "DELETE", {
    id: store.currentChat!.id,
  });
  socket?.emit("leaveChannelRoom", { id: data.id });
  emits("updateChannelsList");
  store.$patch({
    currentChat: undefined,
  });
};

onMounted(() => {});
</script>
