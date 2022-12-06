<template>
  <button @click="$emit('setCurrentChatWindow')">
    <img v-if="picture !== undefined" class="user-image" :src="picture" alt="" />
    <h4>{{ title }}</h4>
  </button>
</template>

<script setup lang="ts">
defineEmits<{
  (e: "setCurrentChatWindow"): void;
}>();

defineProps<{
  title: string;
  picture?: string;
}>();
</script>
<style lang="scss" scoped>
@import "../../styles/variables";
h4 {
  color: $primary;
}
</style>
