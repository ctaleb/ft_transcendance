<template>
	<form
		action="/api/authentication/registration"
		method="post"
		enctype="multipart/form-data"
	>
		<label for="nickname">Nickname:</label><br />
		<input type="text" id="nick" name="nickname" required /><br /><br />
		<label for="password">Password:</label><br />
		<input type="password" id="password" name="password" required /><br /><br />
		<label for="phone">Phone number:</label><br />
		<input
			type="tel"
			id="phone"
			name="phone"
			placeholder="0611111111"
			pattern="[0-9]{10}"
			required
		/><br /><br />
		<label for="avatar">Choose a profile picture:</label><br />
		<input type="file" id="avatar" name="avatar" accept="image/*" /><br /><br />
		<input type="submit" value="Submit" />
	</form>
</template>

<script lang="ts"></script>

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
