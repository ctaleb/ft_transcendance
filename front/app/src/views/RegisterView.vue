<template>
  <div class="mainContainer">
    <h2>Sign up</h2>
    <form>
      <label for="nickname">Nickname:</label><br />
      <input type="text" v-model="v$.nickname.$model" id="nick" name="nickname" class="input" />
      <br /><br />
      <span
        v-for="error in v$.nickname.$errors"
        :key="error.$uid"
        class="text-red"
      >
        {{ error.$message }}
        <br /><br />
      </span>

      <label for="password">Password:</label><br />
      <input
        :type="passwordFieldType"
        v-model="v$.password.firstTry.$model"
        id="password"
        name="password"
        class="input"
      />
      <button
        class="right"
        type="button"
        @click.prevent="hidePassword = !hidePassword"
      >
        show / hide
      </button>
      <br /><br />
      <span
        v-for="error in v$.password.firstTry.$errors"
        :key="error.$uid"
        class="text-red"
      >
        {{ error.$message }}
        <br /><br />
      </span>
      <label for="confirm password">Confirm password:</label><br />
      <input
        type="password"
        v-model="v$.password.confirmation.$model"
        placeholder="Confirm password"
        autocomplete="off"
        class="input"
      /><br /><br />
      <span
        v-for="error in v$.password.confirmation.$errors"
        :key="error.$uid"
        class="text-red"
      >
        {{ error.$message }}
        <br /><br />
      </span>
      <label for="avatar">Choose a profile picture:</label><br />
      <input
        type="file"
        id="avatar"
        name="avatar"
        accept="image/*"
        @change="updateAvatar"
      /><br /><br />
      <span v-for="error in v$.avatar.$errors" :key="error.$uid" class="text-red">
        {{ error.$message }}
        <br /><br />
      </span>

      <input type="submit" value="Submit" @click.stop.prevent="submitForm()" class="submit" />
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed } from "vue";
import { useRouter } from "vue-router";
import useVuelidate from "@vuelidate/core";
import {
  required,
  minLength,
  maxLength,
  sameAs,
  helpers,
} from "@vuelidate/validators";

export default defineComponent({
  name: "RegisterView",
  emits: ["notification"],
  props: ["incomingFriendRequest"],
  setup() {
    const hidePassword = ref(true);
    const passwordFieldType = computed(() =>
      hidePassword.value ? "password" : "text"
    );

    const state = reactive({
      nickname: "",
      password: {
        firstTry: "",
        confirmation: "",
      },
      phone: "",
      avatar: File.prototype,
    });

    const containsUppercase = (value: string) => {
      return /[A-Z]/.test(value);
    };
    const containsLowercase = (value: string) => {
      return /[a-z]/.test(value);
    };
    const containsSpecial = (value: string) => {
      return /[#?!@$%^&*-]/.test(value);
    };
    const containsNumber = (value: string) => {
      return /[0-9]/.test(value);
    };

    const rules = computed(() => ({
      nickname: {
        required: helpers.withMessage("This field cannot be empty", required),
        minLength: minLength(3),
      },
      password: {
        firstTry: {
          required,
          minLength: minLength(6),
          containsUppercase: helpers.withMessage(
            "Password must contain at least one uppercase",
            containsUppercase
          ),
          containsLowercase: helpers.withMessage(
            "Password must contain at least one lowercase",
            containsLowercase
          ),
          containsSpecial: helpers.withMessage(
            "Password must contain at least one of '#?!@$%^&*-'",
            containsSpecial
          ),
          containsNumber: helpers.withMessage(
            "Password must contain at least one digit",
            containsNumber
          ),
        },
        confirmation: {
          required,
          sameAs: helpers.withMessage(
            "Passwords don't match",
            sameAs(state.password.firstTry)
          ),
        },
      },
      phone: { minLength: minLength(9), maxLength: maxLength(13) },
      avatar: {},
    }));

    const v$ = useVuelidate(rules, state);

    const router = useRouter();

    function updateAvatar(event: Event) {
      state.avatar = (event.target as HTMLInputElement).files?.[0]!;
    }

    async function createPost() {
      let formData = new FormData();

      formData.append("nickname", state.nickname);
      if (state.phone != "") formData.append("phone", state.phone);

      formData.append("password", state.password.firstTry);
      if (state.avatar != File.prototype) {
        formData.append("avatar", state.avatar, state.avatar.name);
      }

      fetch(
        "http://" +
          window.location.hostname +
          ":3000/api/authentication/registration",
        {
          method: "POST",
          body: formData,
        }
      )
        .then((response) => response.json())
        .then((data) => {
          router.push("/");
        })
        .catch((err) => {
          console.log(err);
        });
    }

    const submitForm = async () => {
      const isFormValid = await v$.value.$validate();
      if (isFormValid) {
        createPost();
      }
    };

    return {
      state,
      v$,
      updateAvatar,
      createPost,
      submitForm,
      passwordFieldType,
      hidePassword,
    };
  },
});
</script>

<style lang="scss" scoped>

.mainContainer {
  height: auto;
  margin: auto;
  background-color: rgb(25, 23, 23);
  border-radius: 30px;
  width: 40%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  margin-top: 10vh;

  .h2 {
    margin-top: 10vh;
  }

  .input {
    height: 30px;
    font-size: 20px;
    margin-bottom: 10px;
    text-align: center;
  }
  .submit {
    width: 20%;
    height: 5%;
    margin-top: 15px;
    align-items: center;
  }
}
</style>
