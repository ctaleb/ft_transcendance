<template>
  <div class="chat">
    <div v-if="!joined">
      <form @submit.prevent="joinRoom">
        <label>Enter your name</label>
        <input v-model="name" />
        <br /><br />
        <label>Enter the room name</label>
        <input v-model="room" /><br /><br />
        <button type="submit">Join</button>
      </form>
    </div>
    <div class="chat-container" v-else>
      <div class="messages-container">
        <div v-for="message in messages">
          [{{ message.name }}] : {{ message.message }}
        </div>
      </div>
      <hr />
      <div class="message-input">
        <form @submit.prevent="sendMessage">
          <label>Message:</label>
          <input v-model="messageText" />
          <button type="submit">Send</button>
        </form>
      </div>
      <div class="left-panel">
        <div v-for="user in users">[{{ user }}]</div>
      </div>
    </div>
  </div>
  <button @click="createNewChannel()">Create new channel</button>
  <button @click="joinChannel()">Join Channel</button>
  <button @click="inviteToChannel()">Invite to channel</button>
  <friend-alert :requester-name="props.incomingFriendRequest" />
</template>

<style></style>

<script setup lang="ts">
import { io } from "socket.io-client";
import { Message } from "../../../../back/app/src/server/entities/server.entity";
import { onBeforeMount, onMounted, reactive, ref } from "vue";
import config from "../config/config";
import FriendAlert from "../components/FriendAlert.vue";

// const socket = io("http://" + window.location.hostname + ":3000");
// console.log(window.location.hostname);

const socket = config.socket;
// const messages = ref([]);
const props = defineProps(["incomingFriendRequest"]);
const emit = defineEmits(["notification"]);
const messageText = ref("");
const joined = ref(false);
const name = ref("");
const room = ref("");
// let room = "";

let users: String[] = reactive<String[]>([]);
let messages: Message[] = reactive<Message[]>([]);

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

onBeforeMount(() => {
  // socket.on("newUser", (name) => {
  // 	users.value.push(name);
  // });
});

onMounted(() => {
  // if (joined.value === true) {
  // 	let time = setInterval(function () {
  // 		refreshUsers();
  // 	}, 2000);
  // }
  // updateChannel();
});

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
        name: "Private",
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
      id: 24,
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

const joinRoom = () => {
  socket.emit("join", { name: name.value, room: room.value }, () => {
    joined.value = true;
  });

  socket.emit(
    "findAllMessages",
    { room: room.value },
    (response: Message[]) => {
      messages = response;
    }
  );

  socket.emit("findAllUsers", { room: room.value }, (response: String[]) => {
    users = response;
  });

  socket.on("message", (message: Message) => {
    messages.push(message);
  });
};

const sendMessage = () => {
  socket.emit(
    "createMessage",
    { message: messageText.value, room: room.value },
    () => {
      messageText.value = "";
    }
  );
};

// let timer;
const refreshUsers = () => {
  // timer = setTimeout(() => {
  socket.emit("findAllUsers", { room: room.value }, (response: String[]) => {
    users = response;
    console.log(users);
  });
  // }, 1000);
};
</script>
