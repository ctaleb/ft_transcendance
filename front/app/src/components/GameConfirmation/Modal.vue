<template>
  <div class="modal">
    <div>
      <h1>Ready to play ?</h1>
      <button @click="$emit('confirmGame')">Yes</button>
      <button @click="$emit('denyGame')">No</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: "confirmGame"): void;
  (e: "denyGame"): void;
}>();
</script>
