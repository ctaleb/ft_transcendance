<template>
	<p>Welcome to the fc ranscendance portal</p>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { store } from '../store'

export default defineComponent({
	data() {
		return {
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
