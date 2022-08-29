<template>
	<div v-for="user in users" :key="user['id']">
		<UserCardComponent :nick="user['nickname']" />
	</div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import UserCardComponent from "../components/userCardComponent.vue";

export default defineComponent({
	components: {
	   UserCardComponent,
	 },
	data() {
        return {
            users: [],
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
			this.$router.push("/");
		else {
			fetch("http://localhost:3000/api/user/", {
				method: "GET",
				headers: {
					"Authorization": "Bearer " + localStorage.getItem("token"),
				},
			})
			.then(res => res.json())
			.then((data) => {
				this.users = data;
			})
			.catch(err => console.log(err.message));
		}
        })
        .catch(err => console.log(err.message));
    },
});
</script>