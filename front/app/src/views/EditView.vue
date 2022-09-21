<template>
    <div>
        <div v-if="user!=null">
            <p> Notre nouvell page {{ user.nickname }} !</p>
            <p>Created at {{ user.createdAt }}</p>
            <p>Updated at {{ user.updatedAt }}</p>
            <img v-bind:src="image" alt="" style="max-width: 450px; max-height: 300px">
        </div>
        <p v-else>User = null</p>

        <div>
            <form>
                <input type="text" v-model="nickname"/>
                <input type="submit" value="update nickname" @click.stop.prevent="updateNickname()"/>
                <div v-if="nicknameUsed">Nickname is already in use.</div>
                <div v-if="success">Nickname successfully updated.</div>
            </form>
            <label for="avatar">Update your profile picture:</label><br />
            <input
            type="file"
            id="avatar"
            name="avatar"
            accept="image/*"
            @change="updateAvatar"
            />
            <input type="submit" value="update profile picture" @click.stop.prevent="updatePicture()"/>
            
    
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
                console.log("avatar: " + this.avatar)
				funcs.getUserAvatar(this.avatar)
				.then((data: any) => {
                    console.log("in mounted: " + data);
					this.image = URL.createObjectURL(data);
				})
			})
		}
  },

  methods: {
        async updateNickname() {
            let fetch_ret = await fetch("http://localhost:3000/api/user/nicknameEdit/" + this.user.nickname + "/" + this.nickname, {
                method: "PUT",
            })
            .then((res) => {return res.json()})
            .catch((err) => {
                console.log(err);
            })
            console.log("end of updateNickname(): " + JSON.stringify(this.user));
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
        },
        async updatePicture(){
            let formData = new FormData();
            formData.append("avatar", this.newAvatar);
            let fetch_ret = await fetch("http://localhost:3000/api/user/avatarEdit/" + this.user.id, {
                method: "PUT",
                body: formData,
            })
            .then((res) => {return res.json()})
            .catch((err) => {console.log(err)})
            console.log("fetch_ret.avatar.path: " + fetch_ret.avatar.path)
            funcs.getUserAvatar(fetch_ret.avatar.path)
				.then((data: any) => {
                    console.log("in updatePicture: " + data);
					this.image = URL.createObjectURL(data);
				})
        },
    }
});
</script>

blob:http://localhost:3000/07c77512-a894-41d5-9812-f838a9dac94a

