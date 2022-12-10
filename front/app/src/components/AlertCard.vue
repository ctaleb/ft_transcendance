<template>
  <div :class="'alert'" :style="'animation: ' + message.time + 's slidein;'">
    <div :class="'message type' + message.type">
      {{ message.message }}
    </div>
    <div class="close" @click="close()"></div>
  </div>
</template>

<script lang="ts" setup>
import { useStore } from "@/store";
import { Alert } from "@/types/GameSummary";

const props = defineProps<{
  message: Alert;
}>();

const store = useStore();

function close() {
  store.message?.splice(store.message?.indexOf(props.message), 1);
}
</script>
