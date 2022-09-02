<template>
	<div>
		<h2 style="text-align:center">Welcome on fc_transcendance, please Log in</h2>
		<form @submit.prevent="login">
			<label for="username">Username</label>
			<input v-model="username"  type="text" id="username" name="username" /><br /><br />
			<label for="password">Password:</label>
			<input v-model="password" type="password" id="password" name="password" /><br /><br />
			<input type="submit" value="Submit" />
		</form>
		<h3 style="text-align:center">Or <a href="/signup">sign up</a></h3>
	</div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
let funcs = require('../functions/funcs');

export default defineComponent({
data: () => {
	return {
		username: "",
		password: "",
	};
},
mounted() {
	let isConnected = funcs.isConnected(localStorage.getItem("token"));
	console.log(isConnected);
	if (isConnected)
		this.$router.push("/portal");
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
		localStorage.setItem("token", value.token);
		localStorage.setItem("user", JSON.stringify(value.user));
		this.$router.push('/portal');
	})
	},
},
});
</script>

