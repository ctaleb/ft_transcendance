<template>
	<div v-if="user!=null">
		<p>Hello {{ user.nickname }} !</p>
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
			user: JSON.parse(localStorage.getItem("user") || '{}'),
		};
	},
	
	mounted() {
		fetch("http://localhost:3000/api/user/profile", {
		method: "GET",
		headers: {
			"Authorization": "Bearer " + localStorage.getItem("token"),
		},
	})
	.then(res => res.json())
    .then((data) => {
		if (data.message)
			this.$router.push('/');
	})
    .catch(err => console.log(err.message));
  }
});
</script>
