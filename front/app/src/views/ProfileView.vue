<template>
	<div v-if="user!=null">
		<p>Hello {{ user.nickname }} !</p>
		<p>Created at {{ user.createdAt }}</p>
		<p>Updated at {{ user.updatedAt }}</p>
		<img :src="image" alt="" style="max-width: 450px; max-height: 300px">
	</div>
	<p v-else>User = null</p>
</template>

<script lang="ts">
import { defineComponent } from "vue";
let funcs = require('../functions/funcs');

export default defineComponent({
	data() {
		return {
			user: JSON.parse(localStorage.getItem("user") || '{}'),
			avatar: '{}',
			image: "",
		};
	},
	
	mounted() {
		let is_connected = funcs.isConnected(localStorage.getItem("token"));
		if (is_connected == false)
			this.$router.push('/');
		else
		{
			fetch("http://localhost:3000/api/user/" + this.user.id, {
				method: "GET",
				headers: {
					"Authorization": "Bearer " + localStorage.getItem("token"),
				},
			})
			.then(res => res.json())
			.then((data) => {
				this.avatar = data.path;
				fetch("http://localhost:3000/api/user/profile-picture/" + this.avatar, {
					method: "GET",
					headers: {
						"Authorization": "Bearer " + localStorage.getItem("token"),
					},
				})
				.then(res => res.blob())
				.then((data) => {
					console.log(data);
					this.image = URL.createObjectURL(data);
				})
				.catch(err => console.log(err.message));
			})
			.catch(err => console.log(err.message));
		}
  }
});
</script>
