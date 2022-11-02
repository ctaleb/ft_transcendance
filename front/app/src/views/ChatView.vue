<template>
  <div class="mainContainer">
    <div class="convList">
      <h4>Private messages</h4>
      <button v-for="conv in privateConvs" class="privateConvButton">
        <img :src="conv.avatarToDisplay" alt="" width="45" height="45" />
        <p v-if="conv.user1.nickname != clientNickname">
          {{ conv.user1.nickname }}
        </p>
        <p v-else>{{ conv.user2.nickname }}</p>
      </button>
    </div>
    <div class="conversation">
      <div class="messages">
        <p>User1</p>
        <p>User1</p>
        <p>User1</p>
        <p>User1</p>
        <p>User1</p>
        <p>User1</p>
        <p>User1</p>
        <p>User1</p>
        <p>User1</p>
        <p>User1</p>
        <p>User1</p>
        <p>User1</p>
        <p>User1</p>
        <p>User1</p>
      </div>
      <div class="input">
        <input type="text" placeholder="Send message" class="textInput" />
        <button class="sendButton">
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
}
import { UserInfo } from "os";
import { onMounted, ref } from "vue";
let funcs = require("../functions/funcs");
const clientNickname = JSON.parse(
  localStorage.getItem("user") || "{}"
).nickname;
let imageUrl = ref("");
let privateConvs = ref(Array<privateConv>());

onMounted(() => {
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
      console.log(data);
      privateConvs.value = data;
      privateConvs.value.forEach(async (conv) => {
        conv.avatarToDisplay = await getAvatar(conv);
      });
    })
    .catch((err) => console.log(err));
});

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
  overflow: hidden;
  height: 100%;
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
  justify-content: center;
  background: #aa9e7d;
  border: 3px solid;
  border-image-slice: 1;
  border-image-source: linear-gradient(to bottom, #c1a36b, #635e4f);
  height: 3.5%;
}
</style>

<script setup lang="ts"></script>
