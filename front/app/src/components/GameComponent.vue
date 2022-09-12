<template>
	<div class="score">
		Score:
		<div>Host: {{ hostScore }}</div>
		<div>Client: {{ clientScore }}</div>
	</div>
	<div>
		<button @click="findMatch()" :disabled="startButton">
			{{ lobbyStatus }}
		</button>
	</div>
	<div>
		<canvas ref="canvas" width="500" height="500"></canvas>
	</div>

	<div class="modal hidden">
		<h1>Ready to play ?</h1>
		<button @click="confirmGame()">Yes</button>
		<button @click="denyGame()">No</button>
	</div>
	<div class="overlay hidden"></div>
</template>

<style>
.hidden {
	display: none;
}
.modal {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: 70%;
	background-color: white;
	padding: 6rem;
	border-radius: 5px;
	box-shadow: 0 3rem 5rem rgba(0, 0, 0, 0.3);
	z-index: 10;
}
.overlay {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgba(0, 0, 0, 0.6);
	backdrop-filter: blur(3px);
	z-index: 5;
}
</style>

<script setup lang="ts">
import ballUrl from "../assets/ball.png";
import { ref, onMounted, onBeforeMount } from "vue";
import { io } from "socket.io-client";
import {
	GameState,
	GameRoom,
	IBall,
	IPoint,
} from "../../../../back/app/src/chat/entities/message.entity";

const socket = io("http://" + window.location.hostname + ":3000");
const ballImg = new Image();
ballImg.src = ballUrl;

const canvas = ref<HTMLCanvasElement | null>(null);

const startButton = ref(false);
const lobbyStatus = ref("Find match");
const hostScore = ref(0);
const clientScore = ref(0);

let theRoom: GameRoom;

socket.emit("joiningPlayerList");

function findMatch() {
	startButton.value = true;
	lobbyStatus.value = "Looking for an opponent...";

	socket.emit("joinQueue");
}

function confirmGame() {
	socket.emit("playerReady", {}, () => {});
	closeModal();
}

function denyGame() {
	socket.emit("playerNotReady", {}, () => {});
	closeModal();
}

function drawPlayground(ctx: CanvasRenderingContext2D) {
	ctx.clearRect(0, 0, canvas.value!.width, canvas.value!.height);

	// Draw the border + backgroung
	ctx.fillStyle = "black";
	ctx.globalCompositeOperation = "destination-over";
	ctx.fillStyle = "#FFFFFF";
	ctx.fillRect(0, 0, canvas.value!.width, canvas.value!.height);
	ctx.globalCompositeOperation = "source-over";
	ctx.lineWidth = 3;
	ctx.strokeStyle = "#000000";
	ctx.strokeRect(0, 0, canvas.value!.width, canvas.value!.height);
}

function openModal() {
	document.querySelector(".modal")?.classList.remove("hidden");
	document.querySelector(".overlay")?.classList.remove("hidden");
}

function closeModal() {
	document.querySelector(".modal")?.classList.add("hidden");
	document.querySelector(".overlay")?.classList.add("hidden");
}

onMounted(() => {
	let ctx = canvas.value?.getContext("2d");

	socket.on("gameConfirmation", (gameRoom: GameRoom) => {
		theRoom = gameRoom;
		openModal();
	});

	socket.on("ServerUpdate", (gameState: GameState) => {
		let ball = gameState.ball;
		clientScore.value = gameState.score.client;
		hostScore.value = gameState.score.host;
		if (ctx) {
			drawPlayground(ctx);
			ctx.drawImage(
				ballImg,
				ball.pos.x - ball.size,
				ball.pos.y - ball.size,
				ball.size * 2,
				ball.size * 2
			);
			ctx.fillStyle = "black";
			let bar = gameState.hostBar;
			ctx.fillRect(
				bar.pos.x - bar.size.x,
				bar.pos.y - bar.size.y,
				bar.size.x * 2,
				bar.size.y * 2
			);
			bar = gameState.clientBar;
			ctx.fillRect(
				bar.pos.x - bar.size.x,
				bar.pos.y - bar.size.y,
				bar.size.x * 2,
				bar.size.y * 2
			);
		}
	});

	socket.on("startGame", (gameRoom: GameRoom) => {
		theRoom = gameRoom;
	});

	window.addEventListener("keydown", (e) => {
		if (e.key === "ArrowLeft")
			socket.emit("key", {
				key: "downLeft",
			});
		else if (e.key === "ArrowRight")
			socket.emit("key", {
				key: "downRight",
			});
	});

	window.addEventListener("keyup", (e) => {
		if (e.key === "ArrowLeft")
			socket.emit("key", {
				key: "upLeft",
			});
		else if (e.key === "ArrowRight")
			socket.emit("key", {
				key: "upRight",
			});
	});
});
</script>

<style type="text/css">
button:disabled {
	opacity: 0.7;
}
</style>
