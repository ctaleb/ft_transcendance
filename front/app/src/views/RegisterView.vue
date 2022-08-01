<template>
	<div class="container w-50 p-5">
		<test-component />
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import TestComponent from "../components/TestComponent.vue";
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
