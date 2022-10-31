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
      <div v-for="message in allMessages">
        <h6>{{ message.author }}</h6>
        <p>{{ message.text }}</p>
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
const clientNickname: string = JSON.parse(
  localStorage.getItem("user") || "{}"
).nickname;
const props = defineProps(["destNickname"]);
const emit = defineEmits(["closeWindow", "notifChat"]);
let privateMessage = ref("");
let nickname = props["destNickname"];
let allMessages = ref(Array<{ author: string; text: string }>());

function sendPrivateMessage(nickname: string): void {
  if (privateMessage.value != "") {
    socket.emit("deliverMessage", {
      message: privateMessage.value,
      friendNickname: nickname,
    });
    allMessages.value.push({
      author: clientNickname,
      text: privateMessage.value,
    });
    privateMessage.value = "";
  }
}
function closePrivateConv(nickname: string): void {
  emit("closeWindow", nickname);
  console.log("Emit done");
}
function requestConvMessages() {
  socket.emit("getMessages", {
    friendNickname: nickname,
  });
}

onMounted(() => {
  window.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendPrivateMessage(nickname);
  });
  requestConvMessages();
  socket.on("Deliver all messages", (messages) => {
    allMessages.value = messages.messages;
  });
  socket.on(
    "Message to the client",
    (privateMessage: { author: string; text: string }) => {
      allMessages.value.push(privateMessage);
    }
  );
  return;
});
</script>

<style>
@import "../styles/chatWindow.scss";
</style>
