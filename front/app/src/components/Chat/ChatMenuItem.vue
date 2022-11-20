<template>
  <button @click="$emit('click')">
    <img v-if="picture !== undefined" class="user-image" :src="picture" alt="" />
    <h4>{{ title }}</h4>
  </button>
</template>

<script setup lang="ts">
defineEmits<{
  (e: "click"): void;
}>();

defineProps<{
  title: string;
  picture?: string;
}>();
</script>
