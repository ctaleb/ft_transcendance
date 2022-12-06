<template>
  <div class="modal">
    <h1>{{ props.inviter }} wants to play with you !</h1>
    <div>
      <button class="button" @click="$emit('acceptCustom')">Accept</button>
      <button class="button" @click="$emit('denyCustom')">Deny</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: "acceptCustom"): void;
  (e: "denyCustom"): void;
}>();
const props = defineProps<{
  inviter: String;
}>();
</script>

<style lang="scss" scoped>
.modal {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  z-index: 4;
  h1 {
    color: white;
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
