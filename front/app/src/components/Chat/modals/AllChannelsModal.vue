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
import { fetchJSONDatas } from "@/functions/funcs";
import { useStore } from "@/store";
import { Channel } from "@/types/Channel";
import { onMounted, ref, Ref } from "vue";

const allChannels: Ref<Array<Channel>> = ref([]);

const emits = defineEmits<{
  (e: "closeAllChannelsModal"): void;
  (e: "joinChannel"): void;
}>();

const getAllChannels = async (): Promise<void> => {
  await fetchJSONDatas("api/chat/list", "GET")
    .then((data) => {
      allChannels.value = data;
    })
    .catch(() => {});
};

onMounted(() => {
  getAllChannels();
});
</script>
