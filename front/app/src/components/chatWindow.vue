<template>
  <div class="chatWindow">
    <div class="header">
      <button class="crossIconButton" @click="closePrivateConv(nickname)">
        <img
          width="20"
          height="20"
          src="https://findicons.com/files/icons/744/juicy_fruit/256/cross.png"
          alt=""
          class="crossIconImg"
        />
      </button>
      <h4>{{ nickname }}</h4>
    </div>
    <div class="messages">
      <div v-for="messageSent in MessagesSent">
        <h6>Lolo</h6>
        <p>{{ messageSent }}</p>
      </div>
    </div>
    <input type="text" placeholder="Enter a message" v-model="privateMessage" />
    <button
      type="submit"
      class="sendButton"
      @click="sendPrivateMessage(nickname)"
    >
      Send
    </button>
  </div>
</template>
<script lang="ts" setup>
import { onMounted, Ref, ref, watch } from "vue";
import config from "../config/config";
const socket = config.socket;

const props = defineProps(["destNickname"]);
const emit = defineEmits(["closeWindow"]);
let privateMessage = ref("");
let nickname = props["destNickname"];
let MessagesSent = Array<string>();

function sendPrivateMessage(nickname: string): void {
  console.log(nickname);
  socket.emit("deliverMessage", {
    message: privateMessage.value,
    friendNickname: nickname,
  });
  MessagesSent.push(privateMessage.value);
  privateMessage.value = "";
}
function closePrivateConv(nickname: string): void {
  emit("closeWindow", nickname);
  console.log("Emit done");
}
onMounted(() => {
  window.addEventListener("keydown", (e) => {
    console.log(nickname);
    if (e.key === "Enter") sendPrivateMessage(nickname);
  });
  return;
});
</script>

<style>
@import "../styles/chatWindow.scss";
</style>
