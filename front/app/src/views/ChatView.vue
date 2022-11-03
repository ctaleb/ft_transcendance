<template>
  <div class="mainContainer">
    <div class="convList">
      <h4>Private messages</h4>
      <button
        v-for="conv in privateConvs"
        class="privateConvButton"
        @click="displayMessages(conv)"
      >
        <img :src="conv.avatarToDisplay" alt="" width="45" height="45" />
        <p v-if="conv.user1.nickname != clientNickname">
          {{ conv.user1.nickname }}
        </p>
        <p v-else>{{ conv.user2.nickname }}</p>
      </button>
    </div>
    <div class="lobbyChat">
      <h3>Welcome on the chat</h3>
      <br />
      <h5>Chat with your friends with the conatct list to the left</h5>
    </div>
    <div class="conversation hidden">
      <div class="messages">
        <div v-for="message in messagesToDisplay">
          <div v-if="message.author == clientNickname">
            <div class="clientMessage">
              <p style="font-weight: bold; color: white">
                {{ message.author }}
              </p>
              <p>{{ message.text }}</p>
            </div>
          </div>
          <div v-else>
            <div class="friendMessage">
              <p style="font-weight: bold; color: white">
                {{ message.author }}
              </p>
              <p>{{ message.text }}</p>
            </div>
          </div>
        </div>
        <div ref="messagesBoxRef"></div>
      </div>
      <div class="input">
        <input
          type="text"
          placeholder="Send message"
          class="textInput"
          v-model="messageInput"
        />
        <button class="sendButton" @click="sendPrivateMessage(friendNickname)">
          <img
            src="https://uploads-ssl.webflow.com/61cccee6cefd62ba567150d5/61cccee6cefd6280d37151c9_AIRPLANE%20ICON%20256px.png"
            alt=""
            width="50"
            height="50"
            class="sendIcon"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface user {
  id: number;
  nickname: string;
}
export interface privateConv {
  user1: user;
  user2: user;
  avatarToDisplay: string;
  uuid: string;
}
export interface message {
  text: string;
  author: string;
}
import { UserInfo } from "os";
import config from "../config/config";
import { onMounted, onUpdated, ref, watch } from "vue";
const socket = config.socket;
let funcs = require("../functions/funcs");
const clientNickname = JSON.parse(
  localStorage.getItem("user") || "{}"
).nickname;
let friendNickname = ref("");
let imageUrl = ref("");
let messageInput = ref("");
let privateConvs = ref(Array<privateConv>());
let messagesToDisplay = ref(Array<message>());
const messagesBoxRef = ref(<HTMLDivElement | null>null);

onUpdated(() => {
  scrollDownMessages();
});
onMounted(() => {
  socket.on(
    "Message to the client",
    (privateMessage: { author: string; text: string }) => {
      messagesToDisplay.value.push(privateMessage);
    }
  );
  window.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      sendPrivateMessage(friendNickname.value);
    }
  });
  fetch(
    "http://" + window.location.hostname + ":3000/api/privateConv/getAllConvs",
    {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    }
  )
    .then((data) => data.json())
    .then(async (data) => {
      privateConvs.value = data;
      privateConvs.value.forEach(async (conv) => {
        conv.avatarToDisplay = await getAvatar(conv);
      });
    })
    .catch((err) => console.log(err));
});

function scrollDownMessages() {
  messagesBoxRef.value?.scrollIntoView({ behavior: "smooth", block: "end" });
}
async function getAvatar(privateConv: privateConv) {
  let userToFetch: user;
  let url_return: string;
  if (privateConv.user1.nickname == clientNickname)
    userToFetch = privateConv.user2;
  else userToFetch = privateConv.user1;

  url_return = await fetch(
    "http://" +
      window.location.hostname +
      ":3000/api/user/bynickname/" +
      userToFetch.nickname,
    {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    }
  )
    .then((result) => result.json())
    .then(async (data) => {
      return await funcs.getUserAvatar(data.avatar.path).then((data: any) => {
        return URL.createObjectURL(data);
      });
    })
    .catch((err) => console.log(err));
  return url_return;
}

function displayMessages(conv: privateConv) {
  document.getElementsByClassName("conversation")[0].classList.remove("hidden");
  document.getElementsByClassName("lobbyChat")[0].classList.add("hidden");
  conv.user1.nickname == clientNickname
    ? (friendNickname.value = conv.user2.nickname)
    : (friendNickname.value = conv.user1.nickname);
  fetch(
    "http://" +
      window.location.hostname +
      ":3000/api/privateConv/getMessages/" +
      conv.uuid,
    {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    }
  )
    .then((data) => data.json())
    .then((data) => {
      messagesToDisplay.value = data;
    })
    .catch((err) => {
      console.log(err);
    });
}

function sendPrivateMessage(nickname: string): void {
  console.log(nickname);
  if (messageInput.value != "") {
    socket.emit("deliverMessage", {
      message: messageInput.value,
      friendNickname: nickname,
    });
    messagesToDisplay.value.push({
      author: clientNickname,
      text: messageInput.value,
    });
    messageInput.value = "";
  }
}

//reception message
</script>

<style lang="scss" scoped>
.convList {
  height: 90vh;
  width: 15%;
  float: left;
  background-color: antiquewhite;
  overflow-y: scroll;
  overflow: hidden;
}
.conversation {
  float: right;
  background-color: chocolate;
  height: 85vh;
  width: 85%;
}
.messages {
  overflow-y: scroll;
  height: 100%;
  padding-inline: 20%;
}
.input {
  height: 5vh;
  display: flex;
  justify-content: start;
  align-items: center;
  border: 3px solid;
  border-image-slice: 1;
  border-image-source: linear-gradient(to bottom, #c1a36b, #635e4f);
}
.textInput {
  width: 95%;
  height: 100%;
  border: 0px solid;
  font-size: 21px;
  padding-left: 20px;
}
.sendButton {
  height: 100%;
  background: #aa9e7d;
  width: 5%;
}
.privateConvButton {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  background: #aa9e7d;
  border: 3px solid;
  border-image-slice: 1;
  border-image-source: linear-gradient(to bottom, #c1a36b, #635e4f);
  height: 4.5%;
  font-size: 25px;
}
.privateConvButton img {
  margin-right: 20px;
}

.clientMessage {
  text-align: left;
}
.friendMessage {
  text-align: right;
}
.lobbyChat {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: grey;
  height: 90vh;
}
.lobbyChat h5 {
  margin-top: 0;
}
</style>

<script setup lang="ts"></script>
