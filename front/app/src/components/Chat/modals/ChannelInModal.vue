<template>
  <div class="channel-in-modal">
    <h3>{{ channel.name }}</h3>
    <div v-if="channel.type === ChannelType.PUBLIC"><i class="gg-lock-unlock"></i></div>
    <div v-else>
      <i class="gg-lock"></i>
      <input type="password" v-model="passwordField" placeholder="password" />
    </div>
    <button @click="joinChannel(channel)">Join</button>
  </div>
</template>

<script setup lang="ts">
import { fetchJSONDatas } from "@/functions/funcs";
import { useStore } from "@/store";
import { Channel, ChannelType } from "@/types/Channel";
import { onMounted, ref } from "vue";

const props = defineProps<{
  channel: Channel;
}>();

const emits = defineEmits(["joinChannel"]);

const store = useStore();
const passwordField = ref("");
let socket = store.socket;

store.$subscribe((mutation, state) => {
  socket = state.socket;
});

const joinChannel = async (channel: Channel): Promise<void> => {
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
</script>
