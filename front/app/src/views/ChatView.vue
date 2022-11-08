<template>
  <div class="chat"></div>
  <friend-alert :requester-name="props.incomingFriendRequest" />
</template>

<style></style>

<script setup lang="ts">
import { io } from "socket.io-client";
import { onBeforeMount, onMounted, reactive, ref } from "vue";
import config from "../config/config";
import FriendAlert from "../components/FriendAlert.vue";
import Channel from "../types/Channel.ts";

const socket = config.socket;
const props = defineProps(["incomingFriendRequest"]);
const emit = defineEmits(["notification"]);

const myChannels: Channel[] = ref<Channel>([]);
const channelsNum = ref(0);

onMounted(() => {
  getChannels();
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

// const joinRoom = () => {
//   socket.emit("join", { name: name.value, room: room.value }, () => {
//     joined.value = true;
//   });

//   socket.emit(
//     "findAllMessages",
//     { room: room.value },
//     (response: Message[]) => {
//       messages = response;
//     }
//   );

//   socket.emit("findAllUsers", { room: room.value }, (response: String[]) => {
//     users = response;
//   });

//   socket.on("message", (message: Message) => {
//     messages.push(message);
//   });
// };

// function sendMessage() {
//   socket.emit(
//     "createMessage",
//     { message: messageText.value, room: room.value },
//     () => {
//       messageText.value = "";
//     }
//   );
// }

// // let timer;
// const refreshUsers = () => {
//   // timer = setTimeout(() => {
//   socket.emit("findAllUsers", { room: room.value }, (response: String[]) => {
//     users = response;
//     console.log(users);
//   });
//   // }, 1000);
// };
</script>
