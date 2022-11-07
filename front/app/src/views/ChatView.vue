<template>
  <div class="mainContainer">
    <div class="convList">
      <div class="searchBar">
        <div class="searchIcon"><i class="gg-search"></i></div>
        <input
          type="text"
          class="searchField"
          name="searchFriend"
          placeholder="Player name"
        />
      </div>
      <button class="privateMessagesHeader" @click="changeConvListStatus">
        Private messages <i :class="iconConvList"></i>
      </button>
      <button
        v-for="conv in privateConvs"
        class="privateConvButton"
        @click="displayMessages(conv, $event)"
        v-bind:key="conv.uuid"
      >
        <img :src="conv.avatarToDisplay" alt="" width="45" height="45" />
        <p v-if="conv.user1.nickname != clientNickname">
          {{ conv.user1.nickname }}
        </p>
        <p v-else>{{ conv.user2.nickname }}</p>
        <button class="deleteConv" @click="deleteConv(conv)">
          <i class="gg-close"></i>
        </button>
      </button>

      <button class="friendsHeader" @click="changeFriendListStatus">
        Friends <i :class="iconFriendList"></i>
      </button>
      <button
        v-for="friend in friends"
        class="friendButton"
        @click="createConv(friend, $event)"
        v-bind:key="friend.nickname"
      >
        <img :src="friend.avatarToDisplay" alt="" width="45" height="45" />
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

onUpdated(() => {
  scrollDownMessages();
});
onMounted(() => {
  var audio = new Audio(require("../assets/messageReceived.mp3"));
  socket.on(
    "Message to the client",
    (privateMessage: { author: string; text: string }) => {
      if (privateMessage.author == friendNickname.value)
        messagesToDisplay.value.push(privateMessage);
      //don't push in the current array if the message is sent from an other friend
      audio.play();
      organizeFriends();
    }
  );
  socket.on("Update conv list", () => {
    getAllConvs(); //If this signal is received, we fetch again convs to order them from latest to oldest
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

function getAllConvs() {
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
      // console.log("before update-->");
      // console.log(privateConvs.value);
      privateConvs.value = data;
      // console.log("After update-->");
      // console.log(privateConvs.value);
      console.log("Data update-->");
      console.log(data);
      privateConvs.value.forEach(async (conv) => {
        conv.avatarToDisplay = await getAvatar(conv);
      });
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
  const conversations = document.querySelectorAll(".privateConvButton");
  conversations.forEach((conversation) => {
    conversation.classList.add("inactiveConv");
  });
  console.log(event.target);
  event.target.classList.remove("inactiveConv");
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

function changeConvListStatus() {
  if (convListFlag.value == true) {
    const el = document.querySelectorAll(".privateConvButton");
    el.forEach((element) => {
      element.classList.add("hidden");
    });
    iconConvList.value = "gg-add";
    convListFlag.value = false;
  } else {
    const el = document.querySelectorAll(".privateConvButton");
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
function deleteConv(conv: privateConv) {
  console.log("Oye brav gens");
}
</script>

<style lang="scss" scoped>
.convList {
  height: 90vh;
  width: 15%;
  float: left;
  background-color: #5b5a56;
  overflow-y: scroll;
}
.convList h4 {
  color: white;
}
.conversation {
  float: right;
  background-color: #3b3c44;
  height: 85vh;
  width: 85%;
}
.messages {
  overflow-y: scroll;
  height: 100%;
  padding: 0 20%;

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
}
.privateConvButton {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  background: #3b3c44;
  height: 4.5%;
  font-size: 25px;
}
.privateConvButton img {
  margin-right: 20px;
  pointer-events: none;
}
.privateConvButton p {
  pointer-events: none;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.lobbyChat {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #1e2328;
  color: white;
  height: 90vh;
}
.lobbyChat h4 {
  margin-top: 0;
}

.inactiveConv {
  opacity: 0.3;
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
.deleteConv {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: auto;
  max-width: 15%;
  margin-left: auto;
  margin-right: 0;
  background: #3b3c44;
}

//searchbar ,need to move it in a component

.searchBar {
  position: relative;
  display: flex;
  justify-content: flex-start;
  border: 3px solid;
  border-image-slice: 1;
  border-image-source: linear-gradient(to bottom, #242218, #c1a36b);
  background: linear-gradient(to bottom, #071018, #151d23);
  font-size: 10px;
  align-items: center;
  .searchField {
    width: 100%;
    border: unset;
    background: inherit;
    font-size: 2em;
    height: auto;
    color: grey;
  }
  .searchField:focus {
    outline: none;
    caret-color: grey;
  }
  .searchIcon {
    position: relative;
    color: grey;
    margin: 1em;
  }
}
</style>
