<template>
<div>
	<div v-if="$route.path != '/' && $route.path != '/signup'">
		<nav>
			<!-- <router-link to="/signin">Sign in</router-link> |
			<router-link to="/signup">Sign up</router-link> -->
			<router-link to="/portal">Portal</router-link> |
			<router-link to="/game">Game</router-link> |
			<router-link to="/profile">Profile</router-link>
		</nav>
	</div>
	<router-view />
</div>
</template>


<script lang="ts">
import { store } from './store'
import { defineComponent } from "vue";
export default defineComponent({
	data() {
		return {
			isConnected: store.isConnected,
		};
	},
	
// 	mounted() {
// 		fetch("http://localhost:3000/api/user/profile", {
// 		method: "GET",
// 		headers: {
// 			"Authorization": "Bearer " + localStorage.getItem("token"),
// 		},
// 	})
// 	.then(res => res.json())
//     .then((data) => {
// 		if (data.message)
// 			this.isConnected = false;
// 		else
// 			this.isConnected = true;
// 	})
//     .catch(err => console.log(err.message));
//   }
});
</script>


<style lang="scss">
#app {
	font-family: Avenir, Helvetica, Arial, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	text-align: center;
	color: #2c3e50;
}

nav {
	padding: 30px;

	a {
		font-weight: bold;
		color: #2c3e50;

		&.router-link-exact-active {
			color: #42b983;
		}
	}
}
</style>
