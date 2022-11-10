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
          :src="getFriendAvatar(friend)"
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
  <friend-alert :requester-name="props.incomingFriendRequest" />
</template>

<script setup lang="ts">
export interface privateConv {
  user1: User;
  user2: User;
  avatarToDisplay: string;
  uuid: string;
  offset: number;
  notif: boolean;
}
export interface message {
  text: string;
  author: string;
}
import config from "../config/config";
import FriendAlert from "../components/FriendAlert.vue";

import { onMounted, onUpdated, ref, watch } from "vue";
import { useStore } from "@/store";
import { User } from "@/types/GameSummary";
import { Private } from "@babel/types";
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
let friends = ref(Array<User>());
let currentConv = ref<privateConv>();
let isLoadMore = false;
const store = useStore();

const props = defineProps(["incomingFriendRequest"]);
const emit = defineEmits(["notification"]);
const messageText = ref("");
const joined = ref(false);

enum ChannelType {
  PUBLIC = "public",
  PRIVATE = "private",
  PROTECTED = "protected",
}

enum ChannelRole {
  OWNER = "owner",
  ADMIN = "administrator",
  MEMBER = "member",
}

onUpdated(() => {
  if (isLoadMore == false) scrollDownMessages();
  isLoadMore = false;
});
onMounted(async () => {
  var audio = new Audio(require("../assets/adelsol.mp3"));
  socket.on(
    "Message to the client",
    async (privateMessage: { author: string; text: string }) => {
      if (privateMessage.author == friendNickname.value)
        messagesToDisplay.value.push(privateMessage);
      else {
        await getAllConvs();
        organizeFriends();
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
  await getAllConvs();
  if (store.user?.friends) friends.value = store.user?.friends;
  organizeFriends();
});

function getConvAvatar(conv: privateConv) {
  if (clientNickname == conv.user1.nickname)
    return `http://${window.location.hostname}:3000${conv.user2.avatar}`;
  else return `http://${window.location.hostname}:3000${conv.user1.avatar}`;
}
function getFriendAvatar(friend: User) {
  return `http://${window.location.hostname}:3000${friend.avatar}`;
}

function initConv(convs: Array<privateConv>) {
  convs.forEach((conv) => {
    conv.offset = 0;
    conv.notif = false;
  });
}
function getChannels() {
  fetch("http://" + window.location.hostname + ":3000/api/chat", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  })
    .then((res) => {
      return res.json();
    })
    .then((data) => {
      console.log(data);
    })
    .catch((err) => console.log(err));
}

function createNewChannel() {
  fetch(
    "http://" + window.location.hostname + ":3000/api/chat/create-channel",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify({
        name: "Nine",
        type: ChannelType.PRIVATE,
        password: "",
      }),
    }
  )
    .then((res) => {
      return res.json();
    })
    .then((data) => {
      console.log(data);
    })
    .catch((err) => console.log(err));
}

function updateChannel() {
  fetch(
    "http://" + window.location.hostname + ":3000/api/chat/update-channel",
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify({
        id: 22,
        type: "protected",
        password: "password",
      }),
    }
  )
    .then((res) => {
      return res.json();
    })
    .then((data) => {
      console.log(data);
    })
    .catch((err) => console.log(err));
}

function joinChannel() {
  fetch("http://" + window.location.hostname + ":3000/api/chat/join-channel", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
    body: JSON.stringify({
      id: 23,
      password: "password",
    }),
  })
    .then((res) => {
      return res.json();
    })
    .then((data) => {
      console.log(data);
    })
    .catch((err) => console.log(err));
}

function leaveChannel() {
  fetch("http://" + window.location.hostname + ":3000/api/chat/leave-channel", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
    body: JSON.stringify({
      id: 22,
    }),
  })
    .then((res) => {
      return res.json();
    })
    .then((data) => {
      console.log(data);
    })
    .catch((err) => console.log(err));
}

function deleteChannel() {
  fetch(
    "http://" + window.location.hostname + ":3000/api/chat/delete-channel",
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify({
        id: 24,
      }),
    }
  )
    .then((res) => {
      return res.json();
    })
    .then((data) => {
      console.log(data);
    })
    .catch((err) => console.log(err));
}

function inviteToChannel() {
  fetch(
    "http://" + window.location.hostname + ":3000/api/chat/invite-to-channel",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify({
        channelId: 24,
        username: "Boss",
      }),
    }
  )
    .then((res) => {
      return res.json();
    })
    .then((data) => {
      console.log(data);
    })
    .catch((err) => console.log(err));
}

function giveAdmin() {
  fetch("http://" + window.location.hostname + ":3000/api/chat/give-admin", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
    body: JSON.stringify({
      id: 22,
      username: "Ah Sahm",
    }),
  })
    .then((res) => {
      return res.json();
    })
    .then((data) => {
      console.log(data);
    })
    .catch((err) => console.log(err));
}

function takeAdmin() {
  fetch("http://" + window.location.hostname + ":3000/api/chat/take-admin", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
    body: JSON.stringify({
      id: 22,
      username: "Ah Sahm",
    }),
  })
    .then((res) => {
      return res.json();
    })
    .then((data) => {
      console.log(data);
    })
    .catch((err) => console.log(err));
}

function ban() {
  fetch("http://" + window.location.hostname + ":3000/api/chat/ban", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
    body: JSON.stringify({
      id: 23,
      username: "Ah Sahm",
      minutes: 1500,
    }),
  })
    .then((res) => {
      return res.json();
    })
    .then((data) => {
      console.log(data);
    })
    .catch((err) => console.log(err));
}

const channelsNum = ref(0);

function getChannelsList() {
  fetch("http://" + window.location.hostname + ":3000/api/chat/list", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
    body: JSON.stringify({
      number: channelsNum.value,
    }),
  })
    .then((res) => {
      return res.json();
    })
    .then((data) => {
      console.log(data);
      channelsNum.value += data.length;
    })
    .catch((err) => console.log(err));
}

async function getAllConvs() {
  await fetch(
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
        conv.avatarToDisplay = getConvAvatar(conv);
      });
      initConv(privateConvs.value);
    })
    .catch((err) => console.log(err));
}

function organizeFriends() {
  console.log(privateConvs.value.length);
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
function createConv(friend: User, event: any) {
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
      data.conv.avatarToDisplay = getConvAvatar(data.conv);
      data.conv.offset = 0;
      data.conv.notif = false;
      if (data.created == true) {
        privateConvs.value.unshift(data.conv);
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
