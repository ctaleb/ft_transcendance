<template>
  <div :class="'alert'" :style="'animation: ' + message.time + 's slidein;'">
    <div :class="'message type' + message.type">
      {{ props.message.message }}
    </div>
    <div class="close" @click="close()"></div>
  </div>
</template>

<script lang="ts" setup>
import { Message } from "@/types/GameSummary";

const props = defineProps<{
  message: Message;
}>();

function close() {}
</script>

<style lang="scss">
@import "../styles/_profile.scss";
@import "../styles/custom.scss";
</style>
