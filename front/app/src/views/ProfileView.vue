<template>
	<p v-if="user!=null">Hola {{ user['id'] }}</p>
	<p v-else>User = null</p>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { store } from '../store'

export default defineComponent({
	data() {
		return {
			user: null,
		};
	},
	
	mounted() {
		console.log("In profile : " + store.token);
		fetch("http://localhost:3000/api/user/profile", {
		method: "GET",
		headers: {
			"Authorization": "Bearer " + store.token,
		},
	})
	.then(res => res.json())
    .then(data => this.user = data)
    .catch(err => console.log(err.message));
	this.$router.push("/");
  }
});
</script>