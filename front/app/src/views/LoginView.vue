<template>
	<form action="/api/Authentication/login" method="post">
		<label for="nickname">Nickname</label>
		<input type="text" id="nickname" name="nickname" /><br /><br />
		<label for="password">Password:</label>
		<input type="password" id="password" name="password" /><br /><br />
		<input type="submit" value="Submit" />
	</form>
</template>

<script setup lang="ts">
import { ref } from "vue";
import TestComponent from "../components/TestComponent.vue";
</script>
