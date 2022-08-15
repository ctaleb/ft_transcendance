<template>
	<p v-if="user!=null">Hola {{ user.nickname }}</p>
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
			"Authorization": "Bearer " + store.token,
		},
	})
	.then(res => res.json())
    .then((data) => {
		if (store.user.uuid == null)
			this.$router.push('/signin');
	})
    .catch(err => console.log(err.message));
  }
});
</script>