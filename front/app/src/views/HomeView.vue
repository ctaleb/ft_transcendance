<template>
	<div>
		<h2 style="text-align:center">Welcome on fc_transcendance, please Log in</h2>
		<form @submit.prevent="login">
			<label for="username">Username: </label>
			<input
              v-model="username"
              type="text"
              id="username"
              name="username"
              required
            /><br /><br />
			<label for="password">Password: </label>
			<input
              v-model="password"
              type="password"
              id="password"
              name="password"
              required
            /><br /><br />
			<input type="submit" value="Submit" />
		</form>
		<a style="margin-top:1em;margin-bottom:1em;width: 10em;" href="https://api.intra.42.fr/oauth/authorize?client_id=1a90768d9956eae0b0360b4588273a1d4a25143a9c8cfc6a0330dac17b9684db&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2F&response_type=code">Login with 42</a>
		<h3 style="text-align:center;margin-top: 0;">Or <a href="/signup">sign up</a></h3>
	</div>
    <div v-if="login_failed_msg">
      Login failed. Please try again.
    </div>

</template>

<script lang="ts">
import { defineComponent } from "vue";
import { ref } from "vue";

let funcs = require('../functions/funcs');


export default defineComponent({
data: () => {
	return {
        login_failed_msg:  ref(false),
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
    else
        console.log("not connected");
	
	//get back intra code, if exists
	let current_url = window.location.href;
	var url = new URL(current_url);
	let code = url.searchParams.get("code");
	if (code != null)
	{
		console.log(code);
		fetch("http://localhost:3000/api/oauth/" + code, {
			headers: {
				"Content-Type": "application/json"
			},
			method: "POST",
		})
		.then((res) => res.json())
		.then((token) => {
		})
		.catch((err) => console.log(err))
	}
},
methods: {
	async login() {

	console.log("here we are");

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
        .then((response) => {
          console.log("response.status: " + response.status);
          if (response.status != 201) {
            console.log("fetch failed");
            this.login_failed_msg = true;
            throw response.status;
          }
          console.log("fetch success");
          return  response.json();
        })
	.then((value : any) => {
        console.log("username: " + value.username);
		localStorage.setItem("token", value.token);
		localStorage.setItem("user", JSON.stringify(value.user));
		this.$router.push('/portal');
	})
	.catch((error) => {console.log(error)})
	},
},
});
</script>

