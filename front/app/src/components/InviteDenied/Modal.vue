<template>
  <div class="modal">
    <h1>{{ props.inviter }} left the custom lobby.</h1>
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
@import "../../styles/mixins/sizes";

.modal {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  @include screen-lg {
    width: 100vw;
  }
  .button {
    width: 30%;
  }
}
</style>
