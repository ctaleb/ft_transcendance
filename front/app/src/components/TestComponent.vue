<template>
	<form action="/api/users/create" method="post">
		<label for="firstName">First name:</label>
		<input type="text" id="fname" name="firstName" /><br /><br />
		<label for="lastName">Last name:</label>
		<input type="text" id="lname" name="lastName" /><br /><br />
		<input type="submit" value="Submit" />
	</form>
</template>

<script setup lang="ts"></script>
