<template>
	<div v-if="user!=null">
		<p>Hola {{ user.nickname }}</p>
		<p>Created at {{ user.createdAt }}</p>
		<p>Updated at {{ user.updatedAt }}</p>
	</div>
	<p v-else>User = null</p>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { store } from '../store'

export default defineComponent({
	data() {
		return {
			user: store.user,
		};
	},
	
	mounted() {
		console.log("In profile : " + store.token);
		fetch("http://localhost:3000/api/user/profile", {
		method: "GET",
		headers: {
			"Authorization": "Bearer " + localStorage.token,
		},
	})
	.then(res => res.json())
    .then((data) => {
		console.log(data);
		if (!localStorage.isConnected)
			this.$router.push('/signin');
	})
    .catch(err => console.log(err.message));
  }
});
</script>