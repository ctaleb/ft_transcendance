<template>
	<form @submit.prevent="login">
		<label for="username">Username</label>
		<input v-model="username"  type="text" id="username" name="username" /><br /><br />
		<label for="password">Password:</label>
		<input v-model="password" type="password" id="password" name="password" /><br /><br />
		<input type="submit" value="Submit" />
	</form>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { store } from '../store'
export default defineComponent({
data: () => {
	return {
		username: "nicknick",
		password: "motdepasse",
	};
},
methods: {
	async login() {

	fetch("http://localhost:3000/api/Authentication/login", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			username: this.username,
			password: this.password,
		}),
	})
	.then((response) => response.json())
	.then((value) => {
		store.token = value.token;
		store.user = value.user;
		console.log(value.user);
	})
	},
},
});
</script>

