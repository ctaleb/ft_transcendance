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
      <button class="convListHeader" @click="changeConvListStatus">
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
      </button>

      <button class="convListHeader" @click="changeFriendListStatus">
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

      <button class="convListHeader" @click="changeChannelListStatus">
        Channels <i :class="iconChannelList"></i>
      </button>
      <button
        v-for="channel in myChannels"
        class="channelButton"
        @click="loadChannel(channel, $event)"
        v-bind:key="channel.id"
      >
        <p>{{ channel.name }}</p>
      </button>
      <div class="leftActionPannel">
        <button class="convListHeader" @click="channelCreationForm()">
          Create channel
        </button>
        <button class="convListHeader" @click="loadAllChannels()">
          Display all channels
        </button>
      </div>
    </div>
    <div v-if="show == 0" class="lobbyChat">
      <h2>Welcome on the chat</h2>
      <br />
      <h4>Chat with your friends with the contact list to the left</h4>
    </div>
    <div v-if="show == 1" class="lobbyChat allChannels">
      <template v-for="channel in allChannels">
        <div class="channel">
          <h3>{{ channel.name }}</h3>
          <h5 class="textGrey">{{ channel.type }}</h5>
          <div class="channelControl">
            <div v-if="channel.type == ChannelType.PROTECTED" class="searchBar">
              <input
                type="password"
                placeholder="password"
                class="searchField"
                v-model="channel.passwordField"
              />
            </div>
            <button class="joinChannel" @click="joinChannel(channel)">
              Join
            </button>
          </div>
        </div>
      </template>
    </div>
    <div v-if="show == 2" class="conversation">
      <div class="upperChat">
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
              <p>{{ message.date }}</p>
            </div>
            <div v-else class="friendMessage" v-bind:key="message.text">
              <h4 class="friendName">
                {{ message.author }}
              </h4>
              <p>{{ message.text }}</p>
              <p>{{ message.date }}</p>
            </div>
          </template>
          <div ref="messagesBoxRef"></div>
        </div>
        <div v-if="thisChannel != null" class="channelInfo">
          <div class="channelHeader">
            <h1>{{ thisChannel.name }}</h1>
            <h3>{{ thisChannel.type }}</h3>
          </div>
          <template v-for="member in channelMember" class="member"> </template>
          <div class="actionBar"></div>
        </div>
      </div>
      <div class="input">
        <button
          v-if="thisChannel == null"
          class="sendButton"
          @click="sendPrivateMessage(friendNickname)"
        >
          <img
            src="https://uploads-ssl.webflow.com/61cccee6cefd62ba567150d5/61cccee6cefd6280d37151c9_AIRPLANE%20ICON%20256px.png"
            alt=""
            width="50"
            height="50"
            class="sendIcon"
          />
        </button>
        <button v-else class="sendButton" @click="sendChannelMessage()">
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
    <div v-if="show == 3" class="channelCreationForm">
      <form @sumbit.prevent="createChannel()">
        <h2>Create channel</h2>
        <div class="searchBar">
          <input type="text" class="searchField" placeholder="Channel name" />
        </div>
        <div>Channel type: {{ picked }}</div>

        <div class="radioBundle">
          <input
            type="radio"
            id="one"
            value="public"
            v-model="picked"
            checked
          />
          <label for="public">public</label>

          <input type="radio" id="two" value="protected" v-model="picked" />
          <label for="protected">protected</label>

          <input type="radio" id="three" value="private" v-model="picked" />
          <label for="private">private</label>
        </div>
      </form>
    </div>
  </div>
  <friend-alert :requester-name="props.incomingFriendRequest" />
</template>

<script setup lang="ts">
import { io } from "socket.io-client";
import { onMounted, onUpdated, ref, watch, Ref } from "vue";
import config from "../config/config";
import FriendAlert from "../components/FriendAlert.vue";
import { Channel, ChannelType, ChannelRole } from "../types/Channel.ts";

export interface privateConv {
  user1: user;
  user2: user;
  avatarToDisplay: string;
  uuid: string;
}

export interface message {
  text: string;
  author: string;
  date: Date;
}

export interface user {
  nickname: string;
  path: string;
  role: ChannelRole;
  avatarToDisplay: string;
}

const socket = config.socket;

const props = defineProps(["incomingFriendRequest"]);
const emit = defineEmits(["notification"]);

let funcs = require("../functions/funcs");

const clientNickname = JSON.parse(
  localStorage.getItem("user") || "{}"
).nickname;

const friendNickname = ref("");
const imageUrl = ref("");
const messageInput = ref("");
const privateConvs = ref(Array<privateConv>());
const messagesToDisplay = ref(Array<message>());
const messagesBoxRef = ref<HTMLDivElement | null>(null);
const convListFlag = ref(true);
const friendListFlag = ref(true);
const channelListFlag = ref(true);
const iconConvList = ref("gg-remove");
const iconFriendList = ref("gg-remove");
const iconChannelList = ref("gg-remove");
const friends = ref(Array<user>());

const myChannels = ref(Array<Channel>());
const allChannels: Ref<Array<Channel>> = ref([]);
const thisChannel = ref<Channel | null>(null);
const channelMembers = ref(Array<user>());
const channelMessageSkip = ref(0);
const channelsNum = ref(0);
const show = ref(0);
const picked = ref("public");

onUpdated(() => {
  scrollDownMessages();
});
onMounted(() => {
  getChannels();
  var audio = new Audio(require("../assets/messageReceived.mp3"));
  socket.on(
    "Message to the client",
    (privateMessage: { author: string; text: string }) => {
      if (privateMessage.author == friendNickname.value)
        messagesToDisplay.value.push(privateMessage); //don't push in the current array if the message is sent from an other friend
      audio.play();
    }
  );
  socket.on("messageReceived", (channelId: number, msg: message) => {
    console.log(thisChannel.value);
    if (thisChannel.value && channelId === thisChannel.value.id) {
      messagesToDisplay.value.push(msg);
      channelMessageSkip.value++;
    } else {
      console.log("incoming message");
    }
  });
  socket.on("Update conv list", () => {
    getAllConvs().then(() => {
      organizeFriends();
    }); //If this signal is received, we fetch again convs to order them from latest to oldest
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      if (thisChannel.value == null) sendPrivateMessage(friendNickname.value);
      else sendChannelMessage(thisChannel.value);
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
    .then((data: Channel[]) => {
      myChannels.value = data;
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
        name: "Three",
        type: ChannelType.PUBLIC,
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

function joinChannel(channel: Channel) {
  fetch("http://" + window.location.hostname + ":3000/api/chat/join-channel", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
    body: JSON.stringify({
      id: channel.id,
      password: channel.passwordField,
    }),
  })
    .then((res) => {
      if (!res.ok) throw res;
      return res.json();
    })
    .then((data) => {
      myChannels.value.push(data);
      allChannels.value.splice(this.allChannels.indexOf(channel), 1);
      channelsNum.value--;
      socket.emit("joinChannelRoom", { id: data.id });
    })
    .catch((err) => {
      console.log(err);
    });
  channel.passwordField = "";
}

function loadAllChannels() {
  thisChannel.value = null;
  channelsNum.value = 0;
  allChannels.value = [];
  const conversations = document.querySelectorAll(".channelButton");
  conversations.forEach((conversation) => {
    conversation.classList.remove("inactiveConv");
  });
  getAllChannels();
  show.value = 1;
}

function channelCreationForm() {
  thisChannel.value = null;
  channelsNum.value = 0;
  const conversations = document.querySelectorAll(".channelButton");
  conversations.forEach((conversation) => {
    conversation.classList.remove("inactiveConv");
  });
  show.value = 3;
}

function getAllChannels() {
  fetch("http://" + window.location.hostname + ":3000/api/chat/list", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
    body: JSON.stringify({
      skip: channelsNum.value,
    }),
  })
    .then((res) => {
      return res.json();
    })
    .then((data) => {
      if (data.length) {
        if (channelsNum.value == 0) allChannels.value = data;
        else allChannels.value.push(data);
        channelsNum.value += data.length;
      }
    })
    .catch((err) => console.log(err));
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
  thisChannel.value = null;
  const conversations = document.querySelectorAll(".privateConvButton");
  conversations.forEach((conversation) => {
    conversation.classList.add("inactiveConv");
  });
  event.target.classList.remove("inactiveConv");
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
  show.value = 2;
}

function loadChannel(channel: Channel, event: any) {
  const conversations = document.querySelectorAll(".channelButton");
  conversations.forEach((conversation) => {
    conversation.classList.add("inactiveConv");
  });
  event.target.classList.remove("inactiveConv");
  channelMessageSkip.value = 0;
  fetch("http://" + window.location.hostname + ":3000/api/chat/load-channel", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
    body: JSON.stringify({
      id: channel.id,
    }),
  })
    .then((data) => {
      return data.json();
    })
    .then((data) => {
      if (!data.message) {
        thisChannel.value = channel;
        channelMembers.value = data.members;
        messagesToDisplay.value = data.messages;
        channelMessageSkip.value = data.messages.length;
        channelMembers.value.forEach(async (member) => {
          member.avatarToDisplay = await funcs
            .getUserAvatar(member.path)
            .then((image: any) => {
              return URL.createObjectURL(image);
            });
        });
      }
    })
    .catch((err) => {
      messagesToDisplay.value = [
        {
          author: "ERROR",
          text: err.message,
          date: new Date(),
        },
      ];
    });
  show.value = 2;
}

function loadChannelMessages(channel: Channel) {
  fetch("http://" + window.location.hostname + ":3000/api/chat/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
    body: JSON.stringify({
      id: channel.id,
      skip: channelMessageSkip.value,
    }),
  })
    .then((data) => data.json())
    .then((data) => {
      messagesToDisplay.value.push(data);
      channelMessageSkip.value += data.length;
    })
    .catch((err) => {
      messagesToDisplay.value.push({
        author: "ERROR",
        text: err.message,
        date: new Date(),
      });
    });
}

function sendChannelMessage() {
  if (messageInput.value != "") {
    socket.emit(
      "sendChannelMessage",
      {
        channelId: thisChannel.value.id,
        content: messageInput.value,
      },
      (response) => {
        if (!response.author) {
          messagesToDisplay.value.push({
            author: "ERROR",
            text: response.message,
            date: new Date(),
          });
        }
      }
    );
    messageInput.value = "";
  }
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
function changeChannelListStatus() {
  if (channelListFlag.value == true) {
    const el = document.querySelectorAll(".channelButton");
    el.forEach((element) => {
      element.classList.add("hidden");
    });
    iconChannelList.value = "gg-add";
    channelListFlag.value = false;
  } else {
    const el = document.querySelectorAll(".channelButton");
    el.forEach((element) => {
      element.classList.remove("hidden");
    });
    channelListFlag.value = true;
    iconChannelList.value = "gg-remove";
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

.leftActionPannel {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  position: absolute;
  bottom: 0;
  width: inherit;
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
.channelCreationForm {
  background-color: #3b3c44;
  color: white;
  height: 90vh;
  padding-top: 3%;
  .searchBar {
    width: 20%;
  }
  .radioBundle {
    input {
      margin: 1%;
    }
  }
}
.upperChat {
  width: 100%;
  height: 100%;
}
.channelInfo {
  position: relative;
  float: right;
  width: 20%;
  .channelHeader {
    position: relative;
    text-align: left;
    background-color: #5b5a56;
    border-bottom: 3px solid black;
    h1,
    h3 {
      margin-top: 0;
      padding: 4% 0 0 4%;
      color: white;
    }
  }
}
.messages {
  overflow-y: scroll;
  float: left;
  height: 100%;
  width: 80%;
  padding: 0 5%;

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
  justify-content: flex-start;
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
.allChannels {
  overflow-y: scroll;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: flex-start;
  padding: 1%;
  gap: 1%;
}
.channel {
  position: relative;
  padding: 5px;
  border: 3px solid;
  border-image-slice: 1;
  border-image-source: linear-gradient(to bottom, #c1a36b, #635e4f);
  width: 20%;
  text-align: left;
  padding-left: 1em;
  h3 {
    margin-bottom: 0;
  }
}
.channelControl {
  display: flex;
  margin-bottom: 1rem;
  gap: 3%;
}
.joinChannel {
  @extend .convListHeader;
  width: 20%;
}
.textGrey {
  color: grey;
}

.inactiveConv {
  opacity: 0.3;
}
.convListHeader {
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
.channelButton {
  @extend .privateConvButton;
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
