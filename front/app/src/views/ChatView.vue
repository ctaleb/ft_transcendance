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
</template>

<style></style>

<script setup lang="ts">
import { io } from "socket.io-client";
import { onBeforeMount, onMounted, ref } from "vue";

const socket = io("http://" + window.location.hostname + ":3000");
console.log(window.location.hostname);

const messages = ref([]);
const messageText = ref("");
const joined = ref(false);
const name = ref("");
const room = ref("");
const users = ref([]);
// let room = "";

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
});

const joinRoom = () => {
	socket.emit("join", { name: name.value, room: room.value }, () => {
		joined.value = true;
	});

	socket.emit("findAllMessages", { room: room.value }, (response) => {
		messages.value = response;
	});

	socket.emit("findAllUsers", { room: room.value }, (response) => {
		users.value = response;
	});

	socket.on("message", (message) => {
		messages.value.push(message);
	});
};

const sendMessage = () => {
	socket.emit(
		"createMessage",
		{ message: messageText.value, room: room.value },
		(response) => {
			messageText.value = "";
		}
	);
};

// let timer;
const refreshUsers = () => {
	// timer = setTimeout(() => {
	socket.emit("findAllUsers", { room: room.value }, (response) => {
		users.value = response;
		console.log(users);
	});
	// }, 1000);
};
</script>
