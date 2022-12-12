<template>
  <div class="modal">
    <h1>Invitation Failed</h1>
    <button class="button" @click="$emit('invFailure')">Ok</button>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: "invFailure"): void;
}>();
</script>

<style lang="scss" scoped>
@import "../../styles/mixins/sizes";
.modal {
  display: flex;
  padding: 2rem;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  @include screen-lg {
    width: 100vw;
  }
}
</style>
