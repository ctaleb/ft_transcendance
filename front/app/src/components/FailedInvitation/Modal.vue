<template>
  <div class="modal">
    <div>
      <h1>Invitation Failed</h1>
      <button @click="$emit('invFailure')">Ok</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: "invFailure"): void;
}>();
</script>
