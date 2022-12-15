<template>
  <div class="channel-info">
    <div class="channel-options">
      <button class="button" @click="leaveChannel">Leave channel</button>
      <button class="button" v-if="(<Channel>store.currentChat).type === ChannelType.PRIVATE" @click="showInviteToChannelModal = true">
        Invite new member
      </button>
      <button class="button" v-if="user.role === ChannelRole.OWNER" @click="showUpdateChannelModal = true">Update channel</button>
    </div>
    <ChannelMembers />
  </div>
  <InviteToChannel v-if="showInviteToChannelModal" @close-invite-modal="showInviteToChannelModal = false" />
  <ChannelUpdateModal
    v-if="showUpdateChannelModal"
    @close-channel-modal="showUpdateChannelModal = false"
    @update-channel="channelUpdated"
    :channel="<Channel>store.currentChat"
  />
</template>

<script setup lang="ts">
import ChannelMembers from "@/components/chat/ChannelMembers.vue";
import ChannelUpdateModal from "@/components/chat/modals/ChannelUpdateModal.vue";
import InviteToChannel from "@/components/chat/modals/InviteToChannel.vue";
import { fetchJSONDatas } from "@/functions/funcs";
import { socketLocal, useStore } from "@/store";
import { Channel, ChannelRole, ChannelType, ChannelUser } from "@/types/Channel";
import { onMounted, Ref, ref, watch } from "vue";

const store = useStore();

const emits = defineEmits<{
  (e: "updateChannelsList"): void;
  (e: "closeInviteModal"): void;
  (e: "updateChannel"): void;
}>();

const user: Ref<ChannelUser> = ref((<Channel>store.currentChat!).members!.find((member) => member.id === store.user!.id)!);
const showInviteToChannelModal = ref(false);
const showUpdateChannelModal = ref(false);

const leaveChannel = async (): Promise<void> => {
  const data: Channel = await fetchJSONDatas("api/chat/leave-channel", "DELETE", {
    id: store.currentChat!.id,
  }).catch((err) => {
    console.log(err);
  });
  socketLocal.value?.emit("leaveChannelRoom", { id: data.id });
  emits("updateChannelsList");
  store.$patch({
    currentChat: undefined,
  });
};

const channelUpdated = () => {
  const channel: Channel = <Channel>store.currentChat;
  socketLocal.value?.emit("channelUpdated", { id: channel.id, name: channel.name, type: channel.type });
};

onMounted(() => {
  watch(
    () => store.currentChat,
    () => {
      if (store.currentChat && (<Channel>store.currentChat).members)
        user.value = (<Channel>store.currentChat!).members!.find((member) => member.id === store.user!.id)!;
    }
  );
});
</script>
