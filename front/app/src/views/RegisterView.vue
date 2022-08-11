<template>
	<form>
		<label for="nickname">Nickname:</label><br />
		<input
			type="text"
			v-model="nickname"
			id="nick"
			name="nickname"
			required
		/><br /><br />
		<label for="password">Password:</label><br />
		<input
			type="password"
			v-model="password"
			id="password"
			name="password"
			required
		/><br /><br />
		<label for="phone">Phone number:</label><br />
		<input
			type="tel"
			v-model="phone"
			id="phone"
			name="phone"
			placeholder="0611111111"
			pattern="[0-9]{10}"
			required
		/><br /><br />
		<label for="avatar">Choose a profile picture:</label><br />
		<input
			type="file"
			id="avatar"
			name="avatar"
			accept="image/*"
			@change="updateAvatar"
		/><br /><br />
		<input type="submit" value="Submit" @click="createPost()" />
	</form>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
	name: "RegisterView",
	data() {
		return {
			nickname: "",
			password: "",
			phone: "",
			avatar: File.prototype, // To store file data
		};
	},
	methods: {
		updateAvatar(event: Event) {
			this.avatar = (event.target as HTMLInputElement).files?.[0]!;
		},
		createPost() {
			let formData = new FormData();

			formData.append("nickname", this.nickname);
			formData.append("phone", this.phone);
			formData.append("password", this.password);
			formData.append("avatar", this.avatar, this.avatar.name);

			fetch("http://localhost:3000/api/authentication/registration", {
				method: "POST",
				body: formData,
			});
		},
	},
});
</script>
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
