<template>
  <div class="mainContainer">
    <h2>Sign up</h2>
    <form>
      <label for="nickname">Nickname: (15 characters max.)</label><br />
      <input maxlength="15" type="text" v-model="v$.nickname.$model" id="nick" name="nickname" class="input" />
      <br /><br />
      <span v-for="error in v$.nickname.$errors" :key="error.$uid" class="text-red">
        {{ error.$message }}
        <br /><br />
      </span>

      <label for="password">Password:</label><br />
      <input :type="passwordFieldType" v-model="v$.password.firstTry.$model" id="password" name="password" class="input" />
      <button class="right" type="button" @click.prevent="hidePassword = !hidePassword">show / hide</button>
      <br /><br />
      <span v-for="error in v$.password.firstTry.$errors" :key="error.$uid" class="text-red">
        {{ error.$message }}
        <br /><br />
      </span>
      <label for="confirm password">Confirm password:</label><br />
      <input type="password" v-model="v$.password.confirmation.$model" placeholder="Confirm password" autocomplete="off" class="input" /><br /><br />
      <span v-for="error in v$.password.confirmation.$errors" :key="error.$uid" class="text-red">
        {{ error.$message }}
        <br /><br />
      </span>
      <label class="avatarInput" for="avatar"
        >Select picture <i class="gg-image"></i><input type="file" id="avatar" name="avatar" accept="image/*" @change="updateAvatar"
      /></label>
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
import { required, minLength, maxLength, sameAs, helpers } from "@vuelidate/validators";
import { addAlertMessage, fetchJSONDatas } from "@/functions/funcs";
let funcs = require("../functions/funcs");

export default defineComponent({
  name: "RegisterView",
  setup() {
    const hidePassword = ref(true);
    const passwordFieldType = computed(() => (hidePassword.value ? "password" : "text"));
    let fileTooBig: boolean = false;
    const state = reactive({
      nickname: "",
      password: {
        firstTry: "",
        confirmation: "",
      },
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
        maxLength: maxLength(15),
      },
      password: {
        firstTry: {
          required,
          minLength: minLength(9),
          containsUppercase: helpers.withMessage("Password must contain at least one uppercase", containsUppercase),
          containsLowercase: helpers.withMessage("Password must contain at least one lowercase", containsLowercase),
          containsSpecial: helpers.withMessage("Password must contain at least one of '#?!@$%^&*-'", containsSpecial),
          containsNumber: helpers.withMessage("Password must contain at least one digit", containsNumber),
        },
        confirmation: {
          required,
          sameAs: helpers.withMessage("Passwords don't match", sameAs(state.password.firstTry)),
        },
      },
      avatar: {},
    }));

    const v$ = useVuelidate(rules, state);

    const router = useRouter();

    function updateAvatar(event: Event) {
      if ((event.target as HTMLInputElement).files?.[0].size! < 2097152) {
        state.avatar = (event.target as HTMLInputElement).files?.[0]!;
        fileTooBig = false;
      } else {
        fileTooBig = true;
        funcs.addAlertMessage("File too big, should be less than 2Mb", 1);
      }
    }

    async function createPost() {
      let formData = new FormData();

      formData.append("nickname", state.nickname);
      formData.append("password", state.password.firstTry);
      if (state.avatar != File.prototype) {
        formData.append("avatar", state.avatar, state.avatar.name);
      }
      const data = await fetchJSONDatas(`api/authentication/registration`, "POST")
        .then((data) => {
          router.push("/");
        })
        .catch(() => {});
    }

    const submitForm = async () => {
      if (fileTooBig) return;
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
@import "../styles/variables";
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

  .avatarInput {
    input {
      display: none;
    }
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 1rem;
    border: 1px solid $primary;
    border-radius: 10px;
    i {
      margin-left: 10px;
    }
  }
  .avatarInput:hover {
    background: #c1a36b;
    cursor: pointer;
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

//css icon
.gg-image {
  box-sizing: border-box;
  position: relative;
  display: block;
  transform: scale(var(--ggs, 1));
  width: 20px;
  height: 16px;
  overflow: hidden;
  box-shadow: 0 0 0 2px;
  border-radius: 2px;
}
.gg-image::after,
.gg-image::before {
  content: "";
  display: block;
  box-sizing: border-box;
  position: absolute;
  border: 2px solid;
}
.gg-image::after {
  transform: rotate(45deg);
  border-radius: 3px;
  width: 16px;
  height: 16px;
  top: 9px;
  left: 6px;
}
.gg-image::before {
  width: 6px;
  height: 6px;
  border-radius: 100%;
  top: 2px;
  left: 2px;
}
</style>
