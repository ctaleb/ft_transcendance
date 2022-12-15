<template>
  <div class="section">
    <h3>Two Factor Authentication</h3>
    <p>A code was sent to the {{ phone }}</p>
    <input class="codeInput" type="text" placeholder="X X X X X X" v-model="code" maxlength="6" @input="validateCode()" />
    <div v-if="error == true">Please enter a valid code</div>
  </div>
</template>

<script lang="ts" setup>
import { fetchJSONDatas } from "@/functions/funcs";
import { onMounted, ref } from "vue";
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
  await fetchJSONDatas(`api/twofactor/verifyCode/${code.value}/${localStorage.getItem("phoneTo2fa")}`, "POST")
    .then((data) => {
      if (data.status == "approved") {
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
    .catch(() => {});
}
async function sendCode() {
  await fetchJSONDatas(`api/twofactor/sendCode/${localStorage.getItem("phoneTo2fa")}`, "POST")
    .then((data) => {})
    .catch(() => {});
}
</script>
<style lang="scss" scoped>
@import "../styles/inputsAndButtons.scss";
.section {
  text-align: center;
  input {
    text-align: center;
  }
  margin-bottom: auto;
}
</style>
