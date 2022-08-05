<template>
	<form action="/api/Authentication/registration" method="post">
		<label for="nickname">Nickname:</label>
		<input type="text" id="nick" name="nickname" /><br /><br />
		<label for="password">Password:</label>
		<input type="password" id="password" name="password" /><br /><br />
		<input type="submit" value="Submit" />
	</form>
</template>

<script setup lang="ts"></script>

<style scoped>
p {
	user-select: none;
}
</style>

<style>
.greeting {
	color: red;
	font-weight: bold;
}
</style>
