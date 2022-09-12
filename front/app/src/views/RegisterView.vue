<template>
  <form>
    <label for="nickname">Nickname:</label><br />
    <input
           type="text"
           v-model="state.nickname"
           id="nick"
           name="nickname"
           required
           />
    <br /><br />
    <label for="password">Password:</label><br />
    <input
           type="password"
           v-model="state.password.firstTry"
           id="password"
           name="password"
           required
           />
    <br /><br />
    <label for="confirm password">Confirm password:</label><br />
    <input
           type="password"
           v-model="state.password.confirmation"
           placeholder="Confirm password"
           autocomplete="off"
           /><br /><br />
           <label for="phone">Phone number:</label><br />
           <input
                  type="tel"
                  v-model="state.phone"
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
                         <input type="submit" value="Submit" @click.stop.prevent="submitForm()" />

  </form>
</template>

<script lang="ts">

import { defineComponent, reactive, computed } from "vue";
import { useRouter } from 'vue-router';
import useVuelidate from '@vuelidate/core';
import { required, minLength, maxLength, sameAs } from '@vuelidate/validators';


const o = {
	a: 1,
	b: 1,
	c: 1,
	d: 1,
};


export default defineComponent({
  name: "RegisterView",

  setup() {

    const state = reactive({
      nickname: "",
      password: {
        firstTry: "",
        confirmation: "",
      },
      phone: "",
      avatar: File.prototype,
    })

    const router = useRouter()

    function updateAvatar(event: Event) {
      state.avatar = (event.target as HTMLInputElement).files?.[0]!;
    }

    async function createPost() {
      let formData = new FormData();

      //this.submitted = true;

      formData.append("nickname", state.nickname);
      formData.append("phone", state.phone);
      formData.append("password", state.password.firstTry);
      if (state.avatar != File.prototype) {
        formData.append("avatar", state.avatar, state.avatar.name);
      }

      fetch("http://localhost:3000/api/authentication/registration", {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          router.push("/");
        })
        .catch((err) => {
          console.log(err);
        });
    }

    const rules = computed(() => ({
      nickname: { required },
      password: {
        firstTry: { required },
        confirmation: { required, sameAs: sameAs(state.password.firstTry) },
      },
      phone: { required },
    }))

    const v$ = useVuelidate(rules, state);

    function submitForm() {
      v$.value.$touch();
      console.log(v$);

    }

    return { state, v$, updateAvatar, createPost, submitForm };
  },

});

</script>

<style scoped>
p {
  user-select: none;
}

.greeting {
  color: red;
  font-weight: bold;
}
</style>
