<template>
  <div class="modal">
    <div>
      <h1>{{ props.inviter }} wants to play with you !</h1>
      <button @click="$emit('acceptCustom')">Accept</button>
      <button @click="$emit('denyCustom')">Deny</button>
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
