<template>
<div>
	<div v-if="$route.path != '/' && $route.path != '/signup'">
		<nav>
			<!-- <router-link to="/signin">Sign in</router-link> |
			<router-link to="/signup">Sign up</router-link> -->
			<router-link to="/portal">Portal</router-link> |
			<router-link to="/game">Game</router-link> |
			<router-link to="/profile">Profile</router-link> |
			<router-link to="/chat">Chat</router-link> |
			<router-link to="/users">All users</router-link> |
			<router-link to="/" v-on:click.prevent="logout()">Logout</router-link>
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
	methods: {
		logout() {
			localStorage.removeItem("token");
			localStorage.removeItem("user");
		},
	},
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

.text-red {
  color:red;
}
</style>
