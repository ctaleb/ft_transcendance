<template>
  <div class="channel-in-modal">
    <h3>{{ channel.name }}</h3>
    <div v-if="channel.type === ChannelType.PROTECTED">
      <i class="gg-lock"></i>
      <input type="password" v-model="passwordField" placeholder="password" />
    </div>
    <button class="button" @click="joinChannel(channel)">Join</button>
    <button class="button" v-if="channel.type === ChannelType.PRIVATE" @click="declineInvitation(channel)">Decline</button>
  </div>
</template>

<script setup lang="ts">
import { addAlertMessage, fetchJSONDatas } from "@/functions/funcs";
import { useStore } from "@/store";
import { Channel, ChannelType } from "@/types/Channel";
import { onMounted, ref } from "vue";

const props = defineProps<{
  channel: Channel;
}>();

const emits = defineEmits(["joinChannel", "declineInvitation"]);

const store = useStore();
const passwordField = ref("");
let socket = store.socket;

store.$subscribe((mutation, state) => {
  socket = state.socket;
});

const joinChannel = async (channel: Channel): Promise<void> => {
  if (channel.type === ChannelType.PROTECTED && passwordField.value.length <= 0) return;
  await fetchJSONDatas("api/chat/join-channel", "POST", {
    id: channel.id,
    password: passwordField.value,
  })
    .then((data) => {
      emits("joinChannel", channel);
    })
    .catch(() => {});
  passwordField.value = "";
};

const declineInvitation = async (channel: Channel) => {
  await fetchJSONDatas("api/chat/decline-invitation", "DELETE", { id: channel.id })
    .then(() => {
      addAlertMessage("Invitation delined", 1);
      emits("declineInvitation", channel);
    })
    .catch(() => {});
};
</script>

<style lang="scss" scoped></style>
