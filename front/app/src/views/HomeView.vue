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
		<h3 style="text-align:center">Or <a href="/signup">sign up</a></h3>
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
	};
},
mounted() {
	let isConnected = funcs.isConnected(localStorage.getItem("token"));
	console.log(isConnected);
	if (isConnected)
		this.$router.push("/portal");
    else
        console.log("not connected");
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
    .catch( function( error ){
	})
  }
},
});
</script>

