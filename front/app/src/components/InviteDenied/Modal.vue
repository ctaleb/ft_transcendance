<template>
  <div class="modal">
    <div>
      <h1>{{ props.inviter }} declined your invitation...</h1>
      <button @click="$emit('sadStory')">Ok</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: "sadStory"): void;
}>();
const props = defineProps<{
  inviter: String;
}>();
</script>
