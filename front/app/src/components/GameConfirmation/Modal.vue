<template>
  <div class="modal">
    <h1>Ready to play ?</h1>
    <div>
      <button class="button" @click="$emit('confirmGame')">Yes</button>
      <button class="button" @click="$emit('denyGame')">No</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: "confirmGame"): void;
  (e: "denyGame"): void;
}>();
</script>

<style lang="scss" scoped>
@import "../../styles/mixins/sizes";
.modal {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  width: 30%;
  @include screen-lg {
    width: 100vw;
  }
  div {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
    .button {
      width: 30%;
    }
  }
}
</style>
