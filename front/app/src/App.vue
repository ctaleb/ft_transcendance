<template>
<div>
	<nav class="nav justify-content-center">
		<router-link class="nav-link" to="/">Home</router-link>
		<router-link class="nav-link" to="/about"> About</router-link>
		<router-link class="nav-link" to="/register"> Register</router-link>
		<router-link class="nav-link" to="/login"> Login</router-link>
		<router-link class="nav-link" to="/users"> Users</router-link>
	</nav>
	<router-view />
</div>
</template>

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
