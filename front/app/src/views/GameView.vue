<template>
	<game-component />
</template>

<script setup lang="ts">
import { ref } from "vue";
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
