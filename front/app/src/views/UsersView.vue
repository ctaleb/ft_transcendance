<template>
	<div>
    <div v-for="user in users" :key="user['id']">
      <p>user number {{ user['id'] }} : </p>
			<p>{{ user['firstName'] }} --- {{ user['lastName'] }}</p>
			<br>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
  data() {
    return {
      users: []
    }
  },
  mounted() {
    fetch('http://localhost:3000/api/users')
      .then(res => res.json())
      .then(data => this.users = data)
      .catch(err => console.log(err.message))
  }
})
</script>