<template>
	<div class="container w-50 p-5">
		<test-component />
		<form action="/api/users/create/faker" method="POST">
			<button type="submit" class="btn btn-danger btn-lg mt-5">Generate a fake user</button>
		</form>
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
