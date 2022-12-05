<template>
  <div class="modal">
    <h1>{{ props.inviter }} declined your invitation</h1>
    <button class="button" @click="$emit('sadStory')">Ok</button>
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

<style lang="scss" scoped>
@import "../../styles/inputsAndButtons";

.modal {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  .button {
    width: 30%;
  }
}
</style>
