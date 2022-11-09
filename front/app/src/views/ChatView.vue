<template>
  <div class="mainContainer">
    <div class="convList">
      <button class="privateMessagesHeader" @click="changeConvListStatus">
        Private messages <i :class="iconConvList"></i>
      </button>
      <template v-for="conv in privateConvs" v-bind:key="conv.uuid">
        <div class="fullPrivateConvButton">
          <button
            @click="displayMessages(conv, $event)"
            :class="
              conv.notif === true
                ? 'notifPrivateConvButton'
                : 'privateConvButton'
            "
          >
            <img
              :src="conv.avatarToDisplay"
              alt=""
              width="45"
              height="45"
              class="avatar"
            />
            <p v-if="conv.user1.nickname != clientNickname">
              {{ conv.user1.nickname }}
            </p>
            <p v-else>{{ conv.user2.nickname }}</p>
          </button>
          <div
            v-if="currentConv && currentConv.uuid == conv.uuid"
            class="socialOptions"
          >
            <button @click="spectateGame()"><i class="gg-eye"></i></button>
            <button @click="goToProfile()"><i class="gg-profile"></i></button>
          </div>
        </div>
      </template>

      <button class="friendsHeader" @click="changeFriendListStatus">
        Friends <i :class="iconFriendList"></i>
      </button>
      <button
        v-for="friend in friends"
        class="friendButton"
        @click="createConv(friend, $event)"
        v-bind:key="friend.nickname"
      >
        <img
          :src="friend.avatarToDisplay"
          alt=""
          width="45"
          height="45"
          class="avatar"
        />
        <p>{{ friend.nickname }}</p>
      </button>
    </div>
    <div class="lobbyChat">
      <h2>Welcome on the chat</h2>
      <br />
      <h4>Chat with your friends with the contact list to the left</h4>
    </div>
    <div class="conversation hidden">
      <div class="messages">
        <button class="loadMoreButton" @click="loadMoreMessages($event)">
          Load more
        </button>
        <template v-for="message in messagesToDisplay">
          <div
            v-if="message.author == clientNickname"
            class="clientMessage"
            v-bind:key="message.text"
          >
            <h4 class="clientName">
              {{ message.author }}
            </h4>
            <p>{{ message.text }}</p>
          </div>
          <div v-else class="friendMessage" v-bind:key="message.text">
            <h4 class="friendName">
              {{ message.author }}
            </h4>
            <p>{{ message.text }}</p>
          </div>
        </template>
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
          <i class="gg-slack"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface privateConv {
  user1: user;
  user2: user;
  avatarToDisplay: string;
  uuid: string;
  offset: number;
  notif: boolean;
}
export interface message {
  text: string;
  author: string;
}
export interface user {
  nickname: string;
  path: string;
  image: string;
  avatarToDisplay: string;
}
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
let convListFlag = ref(true);
let friendListFlag = ref(true);
let iconConvList = ref("gg-remove");
let iconFriendList = ref("gg-remove");
let friends = ref(Array<user>());
let currentConv = ref<privateConv>();
let isLoadMore = false;

onUpdated(() => {
  if (isLoadMore == false) scrollDownMessages();
  isLoadMore = false;
});
onMounted(() => {
  var audio = new Audio(require("../assets/adelsol.mp3"));
  socket.on(
    "Message to the client",
    (privateMessage: { author: string; text: string }) => {
      if (privateMessage.author == friendNickname.value)
        messagesToDisplay.value.push(privateMessage);
      else {
        notifConv(privateMessage.author);
        audio.play();
      }
    }
  );
  socket.on("Update conv list", (convData: { conv: privateConv }) => {
    let convIndex = privateConvs.value.findIndex(
      (conv) => conv.uuid === convData.conv.uuid
    );
    const convToTop = privateConvs.value.splice(convIndex, 1)[0];
    privateConvs.value.splice(0, 0, convToTop);
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      sendPrivateMessage(friendNickname.value);
    }
  });
  getAllConvs();
  fetch("http://" + window.location.hostname + ":3000/api/friendship", {
    method: "GET",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  })
    .then((res) => {
      return res.json();
    })
    .then((data) => {
      friends.value = data.friends;
      friends.value.forEach(async (friend) => {
        friend.avatarToDisplay = await funcs
          .getUserAvatar(friend.path)
          .then((data: any) => {
            organizeFriends();
            return URL.createObjectURL(data);
          });
      });
    });
});

function initConv(convs: Array<privateConv>) {
  convs.forEach((conv) => {
    conv.offset = 0;
    conv.notif = false;
  });
}

function getAllConvs() {
  return fetch(
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
      initConv(privateConvs.value);
    })
    .catch((err) => console.log(err));
}

function organizeFriends() {
  for (let i = 0; i < privateConvs.value.length; i++) {
    for (let j = 0; j < friends.value.length; j++) {
      if (
        privateConvs.value[i].user1.nickname == friends.value[j].nickname ||
        privateConvs.value[i].user2.nickname == friends.value[j].nickname
      )
        friends.value.splice(j, 1);
    }
  }
}

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

function displayMessages(conv: privateConv, event: any) {
  conv.notif = false;
  if (isLoadMore == false) {
    const conversations = document.querySelectorAll(".privateConvButton");
    conversations.forEach((conversation) => {
      conversation.classList.add("inactiveConv");
    });
    event.target.classList.remove("inactiveConv");
  }
  document.getElementsByClassName("conversation")[0].classList.remove("hidden");
  document.getElementsByClassName("lobbyChat")[0].classList.add("hidden");
  conv.user1.nickname == clientNickname
    ? (friendNickname.value = conv.user2.nickname)
    : (friendNickname.value = conv.user1.nickname);

  fetch(
    "http://" +
      window.location.hostname +
      ":3000/api/privateConv/getMessages/" +
      conv.uuid +
      "/" +
      conv.offset,
    {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    }
  )
    .then((data) => data.json())
    .then((data) => {
      //if currentConv == conv, the user clicked on load more, so we just need to append older messages at the beginning of the array
      if (conv == currentConv.value && isLoadMore)
        messagesToDisplay.value.splice(0, 0, ...data);
      else {
        //Otherwise, the user is changing conversation so we need to replace our array of messages with the new array, and finally set the offset of the previous conv to 0
        messagesToDisplay.value = data;
        if (currentConv.value) currentConv.value.offset = 0;
        currentConv.value = conv;
      }
    })
    .catch((err) => {
      console.log(err);
    });
}

function sendPrivateMessage(nickname: string): void {
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

function changeConvListStatus() {
  if (convListFlag.value == true) {
    const el = document.querySelectorAll(".fullPrivateConvButton");
    el.forEach((element) => {
      element.classList.add("hidden");
    });
    iconConvList.value = "gg-add";
    convListFlag.value = false;
  } else {
    const el = document.querySelectorAll(".fullPrivateConvButton");
    el.forEach((element) => {
      element.classList.remove("hidden");
    });
    convListFlag.value = true;
    iconConvList.value = "gg-remove";
  }
}
function changeFriendListStatus() {
  if (friendListFlag.value == true) {
    const el = document.querySelectorAll(".friendButton");
    el.forEach((element) => {
      element.classList.add("hidden");
    });
    iconFriendList.value = "gg-add";
    friendListFlag.value = false;
  } else {
    const el = document.querySelectorAll(".friendButton");
    el.forEach((element) => {
      element.classList.remove("hidden");
    });
    friendListFlag.value = true;
    iconFriendList.value = "gg-remove";
  }
}
function createConv(friend: user, event: any) {
  friendNickname.value = friend.nickname;
  fetch(
    "http://" +
      window.location.hostname +
      ":3000/api/privateConv/createConv/" +
      friend.nickname,
    {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    }
  )
    .then((data) => data.json())
    .then(async (data) => {
      data.conv.avatarToDisplay = await funcs
        .getUserAvatar(friend.path)
        .then((data: any) => {
          return URL.createObjectURL(data);
        });
      if (data.created == true) {
        privateConvs.value.push(data.conv);
        organizeFriends();
      }
      displayMessages(data.conv, event);
    });
}

function loadMoreMessages(event: any) {
  if (currentConv.value) {
    currentConv.value.offset += 10;
    isLoadMore = true;
    displayMessages(currentConv.value, event);
  }
}

function notifConv(author: string) {
  let conv = privateConvs.value.find(
    (conv) => conv.user1.nickname == author || conv.user2.nickname == author
  );
  if (conv) conv.notif = true;
}

function spectateGame() {
  console.log("spectate");
}
function goToProfile() {
  console.log("profile");
}
</script>

<style lang="scss" scoped>
.convList {
  height: 90vh;
  width: 25%;
  float: left;
  background-color: #5b5a56;
  overflow-y: scroll;

  h4 {
    color: white;
  }
  .privateMessagesHeader {
    padding: 5px;
    border: 3px solid;
    border-image-slice: 1;
    border-image-source: linear-gradient(to bottom, #c1a36b, #635e4f);
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
  }
  .fullPrivateConvButton {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 5%;

    .privateConvButton {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      background: #3b3c44;
      height: 100%;
      font-size: 25px;
      padding: 0;
      img {
        margin-right: 20px;
        pointer-events: none;
      }
      p {
        pointer-events: none;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
      }
    }

    .notifPrivateConvButton {
      @extend .privateConvButton;
      background-color: #c1a36b;
    }
    .socialOptions {
      display: flex;
      align-items: center;
      margin-left: auto;
      height: 100%;
      width: 20%;
      button {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
      }
    }
  }

  .friendsHeader {
    padding: 5px;
    border: 3px solid;
    border-image-slice: 1;
    border-image-source: linear-gradient(to bottom, #c1a36b, #635e4f);
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
  }
  .friendButton {
    @extend .privateConvButton;
  }
}

.lobbyChat {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #1e2328;
  color: white;
  height: 90vh;
  h4 {
    margin-top: 0;
  }
}

.conversation {
  float: right;
  background-color: #3b3c44;
  height: 85vh;
  width: 75%;
  .messages {
    overflow-y: scroll;
    height: 100%;
    padding: 0 20%;

    .loadMoreButton {
      width: 20%;
      border-radius: 50px;
      margin-top: 10px;
      color: #616371;
    }
    .friendName {
      color: #fadba2;
      margin-bottom: 0;
      margin-top: 0;
    }
    .clientName {
      color: #85724e;
      margin-bottom: 0;
      margin-top: 0;
    }
    p {
      margin-bottom: 0;
    }

    & > .clientMessage {
      //border: #c1a36b;
      //border-style: solid;
      background-color: #ede4d3;
      margin: 25px 0 25px auto;
      text-align: left;
      color: #453c2c;
      border-radius: 1.125rem 1.125rem 0 1.125rem;
      width: fit-content;
      max-width: 66%;
      overflow-wrap: break-word;
      padding: 10px;
      min-width: 30%;
    }

    & > .friendMessage {
      background-color: #9c8356;
      //border: #c1a36b;
      //border-style: solid;
      color: white;
      margin: 25px auto 25px 0;
      text-align: left;
      border-radius: 1.125rem 1.125rem 1.125rem 0;
      width: fit-content;
      max-width: 66%;
      overflow-wrap: break-word;
      padding: 10px;
      min-width: 30%;
    }
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
    display: flex;
    justify-content: center;
    align-items: center;
    .gg-slack {
      --ggs: 1.5;
    }
  }
}
.avatar {
  border-radius: 100%;
}
button {
  border: none;
  outline: 0;
  display: inline-block;
  color: white;
  background-color: #000;
  text-align: center;
  cursor: pointer;
  width: 100%;
  font-size: 18px;
}
.inactiveConv {
  opacity: 0.3;
}
</style>
