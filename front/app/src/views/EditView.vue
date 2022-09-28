<template>
    <div style="margin: 3rem;">
        
            <h2> {{ user.nickname }} profile edition</h2>

        <div>
            <div class="edition-section">
                <input class="text-input" type="text" v-model="nickname"/>
                <input class="submit-input" type="submit" value="update nickname" @click.stop.prevent="updateNickname()"/>
                <div v-if="nicknameUsed">Nickname is already in use.</div>
                <div v-if="success">Nickname successfully updated.</div>
            </div>
            <div class="edition-section">
                <img v-bind:src="image" alt="" class="image" /><br>
                <label for="avatar">Update your profile picture:</label><br />
                <input
                type="file"
                id="avatar"
                name="avatar"
                accept="image/*"
                @change="updateAvatar"
                />
            </div>
            <div v-if="!user.intraId" class="edition-section">
                <input class="text-input" type="text" placeholder="new password" v-model="password"/><br /> <br />
                <input class="text-input" type="password" placeholder="please confirm new password" v-model="confirmPassword"/>
                <input class="submit-input" type="submit" value="confirm password" @click.stop.prevent="updatePassword()"/>
                <div v-if="!passwordMatchFlag">Passwords don't match.</div>
                <div v-if="!ValidPasswordFlag">Password must contains at least one uppercase, one lowercase, one special character, and be between 9 and 13 characters long.</div>
                <div v-if="updatePasswordSuccess" color="green">Password successfully updated!</div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import userCardComponentVue from "@/components/userCardComponent.vue";
import { defineComponent, ref } from "vue";
let funcs = require('../functions/funcs');

export default defineComponent({
	data() {
		return {
			user: JSON.parse(localStorage.getItem("user") || '{}'),
			avatar: '{}',
			image: ref(""),
            nickname: JSON.parse(localStorage.getItem("user") || '{}').nickname,
            nicknameUsed: ref(false),
            success: ref(false),
            newAvatar: File.prototype,
            password: ref(""),
            confirmPassword: ref(""),
            ValidPasswordFlag: ref(true),
            passwordMatchFlag: ref(true),
            updatePasswordSuccess: ref(false),
		};
	},

	
	mounted() {
		let isConnected = funcs.isConnected(localStorage.getItem("token"));
		if (isConnected == false)
			this.$router.push('/');
		else
		{
			funcs.getUserById(this.user.id)
			.then((data: any) => {
				this.avatar = data.path;
				funcs.getUserAvatar(this.avatar)
				.then((data: any) => {
					this.image = URL.createObjectURL(data);
				})
			})
		}
  },

  methods: {
        async updateNickname() {
            let fetch_ret = await fetch("http://localhost:3000/api/user/nicknameEdit/" + this.nickname, {
				headers: {
					Authorization: "Bearer " + localStorage.getItem("token"),
				},
                method: "PUT",
            })
            .then((res) => {return res.json()})
            .catch((err) => {
                console.log(err);
            })
            if (fetch_ret.nickname) {
                localStorage.setItem("user", JSON.stringify(fetch_ret));
                this.user = fetch_ret;
                this.nicknameUsed = false;
                this.success = true;
            } else {
                this.nicknameUsed = true;
                this.success = false;
            }
        },
        updateAvatar(event: Event) {
            this.newAvatar = (event.target as HTMLInputElement).files?.[0]!;
            if (this.newAvatar != File.prototype)
                this.updatePicture();       
        },
        async updatePicture(){
            let formData = new FormData();
            formData.append("avatar", this.newAvatar);
            let fetch_ret = await fetch("http://localhost:3000/api/user/avatarEdit", {
				headers: {
					"Authorization": "Bearer " + localStorage.getItem("token"),
				},
                method: "PUT",
                body: formData,
            })
            .then((res) => {return res.json()})
            .catch((err) => {console.log(err)})
            funcs.getUserAvatar(fetch_ret.avatar.path)
				.then((data: any) => {
					this.image = URL.createObjectURL(data);
				})
        },

        containsUppercase(value: string){
            return /[A-Z]/.test(value);
        },
        containsLowercase(value: string){
            return /[a-z]/.test(value);
        },
        containsSpecial(value: string){
            return /[#?!@$%^&*-]/.test(value);
        },
        containsNumber(value: string){
            return /[0-9]/.test(value);
        },

        isValidPassword(password: string){
            return (this.containsUppercase(password) &&
                this.containsLowercase(password) &&
                this.containsSpecial(password) &&
                this.containsNumber(password) &&
                password.length >= 9 && password.length <= 13)
        },

        passwordsMatch(password: string, confirmPassword: string){
            return password === confirmPassword;
        },
        
        async updatePassword() {
            if (!this.isValidPassword(this.password)){
                this.ValidPasswordFlag = false;
                return;
            }
            if (!this.passwordsMatch(this.password, this.confirmPassword)) {
                this.passwordMatchFlag = false;
                return;
            }
            const updateResult = await fetch("http://localhost:3000/api/user/passwordEdit", {
                method: "PUT",
                headers: {
			        "Content-Type": "application/json",
					"Authorization": "Bearer " + localStorage.getItem("token"),
		        },
                body: JSON.stringify({
                    newPassword: this.password,
		        }),
            })
            .then((res) => {return res.json()})
            .catch((err) => {
                console.log(err);
            })
            if (updateResult.success){
                this.updatePasswordSuccess = true;
            }
        }
    }
});
</script>

<style>
    .edition-section {
        border: 0.2rem solid black;
        border-radius: 10px;
        margin-top: 0.5rem;
        padding: 0.5rem;
    }
    .image {
        width: 300px;
        height: 300px;
        border-style: inset;
        border-radius: 50%;
        object-fit: cover;
    }
    .text-input {
        padding: 0.7rem;
        width: 50%;
        box-sizing: border-box;
    }
    .submit-input {
        padding: 0.7rem;
        background-color: #5AFF75;
    }
</style>
