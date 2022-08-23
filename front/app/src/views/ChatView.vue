<template>
	<div class="chat">
		<div v-if="!joined">
			<form @submit.prevent="join">
				<label>Enter your name</label>
				<input v-model="name" />
				<button type="submit">Join</button>
			</form>
		</div>
		<div class="chat-container" v-else>
			<div class="messages-container">
				<div v-for="message in messages">
					[{{ message.name }}] : {{ message.message }}
				</div>
			</div>
			<div v-if="typingDisplay">{{ typingDisplay }}</div>
			<hr />
			<div class="message-input">
				<form @submit.prevent="sendMessage">
					<label>Message:</label>
					<input v-model="messageText" @input="emitTyping" />
					<button type="submit">Send</button>
				</form>
			</div>
		</div>
	</div>
</template>

<style></style>

<script setup lang="ts">
import { io } from "socket.io-client";
import { onBeforeMount, ref } from "vue";

const socket = io("http://10.19.1.157:3000");

const messages = ref([]);
const messageText = ref("");
const joined = ref(false);
const name = ref("");
const typingDisplay = ref("");

onBeforeMount(() => {
	socket.emit("findAllMessages", {}, (response) => {
		messages.value = response;
	});

	socket.on("message", (message) => {
		messages.value.push(message);
	});

	socket.on("typing", ({ name, isTyping }) => {
		if (isTyping) {
			typingDisplay.value = `${name} is typing...`;
		} else {
			typingDisplay.value = "";
		}
	});
});

const join = () => {
	socket.emit("join", { name: name.value }, () => {
		joined.value = true;
	});
};

const sendMessage = () => {
	socket.emit("createMessage", { message: messageText.value }, (response) => {
		messageText.value = "";
	});
};

let timeout;
const emitTyping = () => {
	socket.emit("typing", { isTyping: true });
	clearTimeout(timeout);
	timeout = setTimeout(() => {
		socket.emit("typing", { isTyping: false });
	}, 2000);
};
</script>
