<template>
  <div class="mainContainer">
    <h3>Two Factor Authentication</h3>
    <p>A code will be send to your phone number</p>
    <input
      class="codeInput"
      type="text"
      placeholder="_ _ _ - _ _ _"
      v-model="code"
      maxlength="6"
    />
    <div v-if="error == true">Please enter a valid code</div>
    <button class="sendCodeButton" @click="sendCode()">Send code</button>
    <button class="validateCodeButton" @click="validateCode(code)">
      Validate code
    </button>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "@vue/reactivity";
import { watch } from "fs";
import { onMounted, ref } from "vue";
import * as funcs from "@/functions/funcs";
let code = ref("");
let error = ref(false);

//const isCodeEntered = computed(() => {
//  return code.value.length == 6 ? true : false;
//});
const emit = defineEmits(["twofaSuccess", "update:modelValue"]);
onMounted(() => {});

async function validateCode() {
  await fetch(
    "http://" +
      window.location.hostname +
      ":3000/api/twofactor/verifyCode/" +
      code.value +
      "/" +
      localStorage.getItem("phoneTo2fa"),
    {
      method: "POST",
    }
  )
    .then((data) => data.json())
    .then((data) => {
      if (data.status == "approved") {
        console.log("code validated");
        emit("update:modelValue", true);
        emit("twofaSuccess");
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
  await fetch(
    "http://" +
      window.location.hostname +
      ":3000/api/twofactor/sendCode/" +
      localStorage.getItem("phoneTo2fa"),
    {
      method: "POST",
    }
  )
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
<style lang="scss">
.mainContainer {
  height: 50vh;
  margin: auto;
  background-color: rgb(25, 23, 23);
  border-radius: 30px;
  width: 40%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;

  .codeInput {
    height: 50px;
    font-size: 20px;
    margin-bottom: 10px;
    text-align: center;
  }
  .sendCodeButton {
    width: 20%;
    color: white;
    height: 5%;
    margin-top: 15px;
  }
  .validateCodeButton {
    width: 20%;
    color: white;
    height: 7%;
    margin-top: 15px;
  }
}
</style>
