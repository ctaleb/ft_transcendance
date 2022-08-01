<template>
	<div>
    <table class="table table-striped table-hover">
      <thead>
        <tr class="table-primary">
          <th scope="col">ID</th>
          <th scope="col">First name</th>
          <th scope="col">Last name</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user['id']">
            <td scope="row">{{ user['id'] }}</td>
            <td>{{ user['firstName'] }}</td>
            <td>{{ user['lastName'] }}</td>
        </tr>
      </tbody>
    </table>
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