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
		<button style="margin-top:1em;margin-bottom:1em;width: 10em;" v-on:click="oauth()">Login with 42</button>
		<h3 style="text-align:center;margin-top: 0;">Or <a href="/signup">sign up</a></h3>
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
		token: {
			"access_token": null,
			"token_type":null,
			"expires_in":null,
			"scope":null,
			"created_at":null
		},
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

	async oauth() {

	await fetch("https://api.intra.42.fr/oauth/token", {
		body: "grant_type=client_credentials&client_id=1a90768d9956eae0b0360b4588273a1d4a25143a9c8cfc6a0330dac17b9684db&client_secret=fc3b24dee46ae52d1c335e8ef794d2de3dcd530b97fa22aeb19267de032a9f49",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded"
		},
		method: "POST"
	})
	.then((res) => res.json())
	.then((value) => { this.token = value; console.log("TOKEN : " + this.token.access_token); })
	.catch((err) => {console.log(err); })
	console.log("TOKEN2 : " + this.token.access_token);
	fetch("https://api.intra.42.fr/v2/cursus", {
		headers: {
			"Authorization": "Bearer " + this.token.access_token,
		},
	})
	.then((value) => {console.log(value.json())});

	},
},
});
</script>

