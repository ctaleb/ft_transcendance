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
</template>

<script setup lang="ts">
import ballUrl from "../assets/ball.png";
import { ref, onMounted, onBeforeMount } from "vue";
import { io } from "socket.io-client";
import { getBaseTransformPreset } from "@vue/compiler-core";
import { Emitter } from "@socket.io/component-emitter";
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

let gameRoom: GameRoom;

function findMatch() {
	startButton.value = true;
	lobbyStatus.value = "Looking for an opponent...";

	socket.emit("joinQueue");
}

function playerReady() {
	lobbyStatus.value = "Waiting for the other player...";
	socket.emit("playerReady", { clientGameState }, () => {});
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

onMounted(() => {
	let ctx = canvas.value?.getContext("2d");

	socket.on("gameConfirmation", (gameRoom) => {
		gameRoom = gameRoom;
		lobbyStatus.value =
			"Are you ready to play a ranked game against a very strong opponent ?";
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

	socket.on("startGame", (gameRoom) => {
		gameRoom = gameRoom;
	});

	window.addEventListener("keydown", (e) => {
		if (e.key === "ArrowLeft")
			socket.emit("key", {
				room: gameRoom.name,
				key: "downLeft",
			});
		else if (e.key === "ArrowRight")
			socket.emit("key", {
				room: gameRoom.name,
				key: "downRight",
			});
	});

	window.addEventListener("keyup", (e) => {
		if (e.key === "ArrowLeft")
			socket.emit("key", {
				room: gameRoom.name,
				key: "upLeft",
			});
		else if (e.key === "ArrowRight")
			socket.emit("key", {
				room: gameRoom.name,
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
