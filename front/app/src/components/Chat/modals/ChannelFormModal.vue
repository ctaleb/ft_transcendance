<template>
	<div class="overlay"></div>
	<div class="modal">
	  <span @click="$emit('closeChannelModal')" class="close-modal"><i class="gg-close-o"></i></span>
	  
	</div>
  </template>
  
  <script setup lang="ts">
  import ChannelInModal from "@/components/chat/modals/ChannelInModal.vue";
  import { useStore } from "@/store";
  import { Channel } from "@/types/Channel";
  import { onMounted } from "vue";
  
  const props = defineProps<{
	channel: Channel | null;
  }>();
  
  const emits = defineEmits<{
	(e: "closeChannelModal"): void;
  }>();
  
  const store = useStore();
  let socket = store.socket;
  
  store.$subscribe((mutation, state) => {
	socket = state.socket;
  });
  </script>
  