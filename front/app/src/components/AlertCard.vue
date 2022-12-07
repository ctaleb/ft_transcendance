<template>
  <div :class="'alert'" :style="'animation: ' + message.time + 's slidein;'">
    <div :class="'message type' + message.type">
      {{ props.message.message }}
    </div>
    <div class="close" @click="close()"></div>
  </div>
</template>

<script lang="ts" setup>
import { Alert } from "@/types/GameSummary";

const props = defineProps<{
  message: Alert;
}>();

function close() {}
</script>
