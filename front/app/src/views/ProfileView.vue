<template>
	<p v-if="user!=null">Hola {{ user['id'] }}</p>
	<p v-else>User = null</p>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
	data() {
		return {
			user: null,
		};
	},
	mounted() {
    fetch('http://localhost:3000/api/user/profile')
      .then(res => res.json())
      .then(data => this.user = data)
      .catch(err => console.log(err.message))
  }
});
</script>