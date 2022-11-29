<template>
  <div class="mainContainer">
    <h3>Two Factor Authentication</h3>
    <p>A code was sent to the {{ phone }}</p>
    <input class="codeInput" type="text" placeholder="X X X X X X" v-model="code" maxlength="6" @input="validateCode()" />
    <div v-if="error == true">Please enter a valid code</div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "@vue/reactivity";
import { watch } from "fs";
import { onMounted, onUpdated, ref } from "vue";
import * as funcs from "@/functions/funcs";
let code = ref("");
let error = ref(false);
let phone = ref(hidePhone(localStorage.getItem("phoneTo2fa")));
//const isCodeEntered = computed(() => {
//  return code.value.length == 6 ? true : false;
//});
const emit = defineEmits(["twofaSuccessClassicUser", "twofaSuccessIntraUser", "update:modelValue"]);

onMounted(() => {
  phone.value = hidePhone(localStorage.getItem("phoneTo2fa"));
});

function hidePhone(phone: string | null): string | null {
  let retPhone = phone;
  if (phone) {
    retPhone = phone.slice(0, 4) + phone.slice(4).replace(/.(?=....)/g, "*");
  }
  return retPhone;
}

async function validateCode() {
  if (code.value.length != 6) return;
  await fetch("http://" + window.location.hostname + ":3000/api/twofactor/verifyCode/" + code.value + "/" + localStorage.getItem("phoneTo2fa"), {
    method: "POST",
  })
    .then((data) => data.json())
    .then((data) => {
      if (data.status == "approved") {
        console.log("code validated");
        emit("update:modelValue", true);
        if (localStorage.getItem("userType") == "classic") emit("twofaSuccessClassicUser");
        else emit("twofaSuccessIntraUser");
        localStorage.removeItem("phoneTo2fa");
        localStorage.removeItem("userType");
        error.value = false;
      } else {
        error.value = true;
      }
    })
    .catch((err) => {
      console.log(err);
    });
}
async function sendCode() {
  await fetch("http://" + window.location.hostname + ":3000/api/twofactor/sendCode/" + localStorage.getItem("phoneTo2fa"), {
    method: "POST",
  })
    .then((data) => data.json())
    .then((data) => {
      console.log(data.status);
      //error in the console(unexpected json input) because i don't return jsons format in the service and the controller. Need to add return before the send function, and make a json return int eh last then
    })
    .catch((err) => {
      console.log(err);
    });
}
</script>
<style lang="scss" scoped>
@import "../styles/inputsAndButtons.scss";
.mainContainer {
  text-align: center;
  input {
    text-align: center;
  }
  margin-bottom: auto;
}
</style>
