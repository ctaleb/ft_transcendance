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
    <!--   <div :style="{ color: login_failed_color }" v-if="login_failed_msg"> -->
    <div class="text-red" v-if="login_failed_msg">
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
		username: "",
		password: "",
        login_failed_msg:  ref(false),
        //login_failed_color: 'red',
	};
},
mounted() {
	let isConnected = funcs.isConnected(localStorage.getItem("token"));
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
        .then((response) => {
          if (response.status != 201) {
            this.login_failed_msg = true;
            throw response.status;
          }
          return  response.json();
        })
	.then((value : any) => {
		localStorage.setItem("token", value.token);
		localStorage.setItem("user", JSON.stringify(value.user));
		this.$router.push('/portal');
	})
    .catch((error) => {
      console.log(error);
	})
  }
},
});
</script>

