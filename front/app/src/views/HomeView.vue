<template>
	<p class="greeting" @click="increment()">{{ number }}</p>
	<input type="text" name="hey" id="ho" v-model="text" />
	<h2>{{ text }}</h2>
</template>

<script lang="ts">
export default {
	data() {
		return {
			text: "",
			number: 1,
		};
	},
};
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
