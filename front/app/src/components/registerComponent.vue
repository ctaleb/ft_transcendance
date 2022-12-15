<template>
  <form>
    <input maxlength="15" type="text" v-model="v$.nickname.$model" id="nick" name="nickname" placeholder="Nickname" />
    <span v-for="error in v$.nickname.$errors" :key="error.$uid">
      {{ error.$message }}
    </span>

    <input :type="passwordFieldType" v-model="v$.password.firstTry.$model" id="password" name="password" placeholder="Password" />
    <!--<button class="right" type="button" @click.prevent="hidePassword = !hidePassword">show / hide</button>-->
    <span v-if="v$.password.firstTry.$errors.length > 0">
      Password must contains at least one uppercase, one lowercase, one special character, one digit and be longer than 9 characters.
    </span>
    <input type="password" v-model="v$.password.confirmation.$model" autocomplete="off" placeholder="Confirm password" />
    <span v-for="error in v$.password.confirmation.$errors" :key="error.$uid">
      {{ error.$message }}
    </span>
    <div class="alignAvatarDiv">
      <label class="fileInput" :class="{ fileInputActive: pictureUploadedFlag }" for="avatar"
        >Select picture <i class="gg-image"></i><input type="file" id="avatar" name="avatar" accept="image/*" @change="updateAvatar" />
      </label>
      <span v-for="error in v$.avatar.$errors" :key="error.$uid">
        {{ error.$message }}
      </span>
    </div>

    <input type="submit" class="button" value="Submit" @click.stop.prevent="submitForm()" style="margin-bottom: 50px" />
    <button class="previousPage" @click="emitCompleteRegister()"><i class="gg-arrow-left"></i></button>
  </form>
</template>

<script lang="ts" setup>
import { defineComponent, ref, reactive, computed } from "vue";
import { useRouter } from "vue-router";
import useVuelidate from "@vuelidate/core";
import { required, minLength, maxLength, sameAs, helpers } from "@vuelidate/validators";
import { addAlertMessage, fetchJSONDatas } from "@/functions/funcs";
let funcs = require("../functions/funcs");

const emit = defineEmits(["update:modelValue"]);
let pictureUploadedFlag = ref(false);
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
  if (!(event.target as HTMLInputElement).files?.[0]) return;
  if ((event.target as HTMLInputElement).files?.[0].size! < 2097152) {
    state.avatar = (event.target as HTMLInputElement).files?.[0]!;
    fileTooBig = false;
    pictureUploadedFlag.value = true;
    addAlertMessage("File uploaded", 2);
  } else {
    pictureUploadedFlag.value = false;
    fileTooBig = true;
    funcs.addAlertMessage("File too big, should be less than 2Mb", 1);
  }
}

async function createPost() {
  let formData = new FormData();
  state.nickname = state.nickname.trim();
  formData.append("nickname", state.nickname);
  formData.append("password", state.password.firstTry);
  if (state.avatar != File.prototype) {
    formData.append("avatar", state.avatar, state.avatar.name);
  }
  let data = await fetch("http://" + window.location.hostname + ":3000/api/authentication/registration", {
    method: "POST",
    body: formData,
  })
    .then(async (response) => {
      if (!response.ok) return Promise.reject(await response.json());
      return response.json();
    })
    .catch(async (err) => {
      addAlertMessage(err.message, 3);
      return null;
    });
  if (data) {
    emitCompleteRegister();
    addAlertMessage("Account successfully created", 2);
  }
}
function emitCompleteRegister() {
  emit("update:modelValue", false);
}

const submitForm = async () => {
  if (fileTooBig) return;
  const isFormValid = await v$.value.$validate();
  if (isFormValid) {
    createPost();
  }
};
</script>

<style lang="scss" scoped>
@import "../styles/variables";
@import "../styles/inputsAndButtons";
form {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  .alignAvatarDiv {
    display: flex;
    width: 100%;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  span {
    margin: 15px 15px 30px 15px;
    color: $primary;
  }
  .previousPage {
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    margin-right: auto;
    margin-left: 45px;
    background: #2f2a2c;
    color: $primary;
    border: none;
    padding: 6px;
    border-radius: 100%;
  }
  .previousPage:hover {
    color: white;
  }
  .gg-arrow-left {
    padding: 12px;
  }
}
</style>
