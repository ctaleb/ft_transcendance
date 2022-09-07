<template>
	<form>
		<label for="nickname">Nickname:</label><br />
		<input
			type="text"
			v-model="nickname"
			id="nick"
			name="nickname"
			required
		/>
        <br /><br />
		<label for="password">Password:</label><br />
		<input
			type="password"
			v-model="password"
			id="password"
			name="password"
			required
		/>
        <br /><br />
        <label for="confirm password">Confirm password:</label><br />
        <input
            type="password"
            placeholder="Confirm password"
            value=""
            autocomplete="off"
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
		<input type="submit" value="Submit" @click.stop.prevent="createPost()" />
	</form>
</template>

<script lang="ts">

import { defineComponent } from "vue";
import useVuelidate from '@vuelidate/core'
import { required, minLength, maxLength, sameAs } from '@vuelidate/validators'

export default defineComponent({
	name: "RegisterView",

    setup() {
        console.log("in setup()");
		const v$ = useVuelidate();
		console.log(v$);
		const isDisabled = () => {
			//v$.$invalid;
		};
        return { v$, isDisabled }
    }, // activate Vuelidate

	data() {
		return {
			nickname: "",
			password: "",
			phone: "",
			avatar: File.prototype, // To store file data
            submitted: false,
		};
	},

    validations() {
        return {
            nickname: { required },
            password: { required },
            confirmPassword: { required, sameAsPassword: sameAs("password") }
        };
    },

	methods: {
		updateAvatar(event: Event) {
			this.avatar = (event.target as HTMLInputElement).files?.[0]!;
		},
		async createPost() {
			let formData = new FormData();

            this.submitted = true;

			formData.append("nickname", this.nickname);
			formData.append("phone", this.phone);
			formData.append("password", this.password);
			if (this.avatar != File.prototype) {
				formData.append("avatar", this.avatar, this.avatar.name);
			}

			fetch("http://localhost:3000/api/authentication/registration", {
				method: "POST",
				body: formData,
			})
				.then((response) => response.json())
				.then((data) => {
					this.$router.push("/");
				})
				.catch((err) => {
				//	this.$router.push("/");
					console.log(err);
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
