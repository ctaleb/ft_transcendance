<template>
	<form action="/api/authentication/registration" method="post">
		<label for="nickname">Nickname:</label>
		<input type="text" id="nick" name="nickname" required /><br /><br />
		<label for="password">Password:</label>
		<input type="password" id="password" name="password" required /><br /><br />
		<label for="phone">Phone number:</label>
		<input
			type="tel"
			id="phone"
			name="phone"
			placeholder="0611111111"
			pattern="[0-9]{10}"
			required
		/><br /><br />
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
