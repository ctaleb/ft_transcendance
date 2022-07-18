<template>
  <test-component :name="'Test'" />
  <game-component />
  <!-- <p class="greeting">{{ number }}</p> -->
</template>

<script setup lang="ts">
import { ref } from "vue";
import TestComponent from "../components/TestComponent.vue";
import GameComponent from "../components/GameComponent.vue";
</script>

<style scoped>
p {
  user-select: none;
}
</style>

<style>
.greeting {
  color: red;
  font-weight: bold;
}
</style>
