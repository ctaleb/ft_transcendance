<template>
  <div class="channel-info">
    <div class="channel-options">
      <button @click="leaveChannel" class="primary-btn">Leave channel</button>
      <button v-if="(<Channel>store.currentChat).type === ChannelType.PRIVATE" class="primary-btn">Invite new member</button>
    </div>
    <ChannelMembers />
  </div>
</template>

<script setup lang="ts">
import ChannelMembers from "@/components/chat/ChannelMembers.vue";
import { fetchJSONDatas } from "@/functions/funcs";
import { useStore } from "@/store";
import { Channel, ChannelType } from "@/types/Channel";
import { Conversation } from "@/types/Conversation";
import { User } from "@/types/User";
import { onMounted, onUpdated, Ref, ref } from "vue";

const store = useStore();
let socket = store.socket;

const emits = defineEmits<{
  (e: "updateChannelsList"): void;
}>();

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
