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
import { GameState } from "../../../../back/app/src/game.core";
import { Game } from "../../../../back/app/src/chat/entities/message.entity";

const socket = io("http://" + window.location.hostname + ":3000");
const ballImg = new Image();
ballImg.src = ballUrl;

const canvas = ref<HTMLCanvasElement | null>(null);

interface IPoint {
	x: number;
	y: number;
}

const startButton = ref(false);
const lobbyStatus = ref("Find match");

function findMatch() {
	startButton.value = true;
	lobbyStatus.value = "Looking for an opponent...";

	socket.emit("joinQueue");
}

interface IBall {
	size: number;
	pos: IPoint;
	speed: IPoint;
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

let ctx = canvas.value?.getContext("2d");

const joined = ref(false);
const name = ref("");
const hostScore = ref(0);
const clientScore = ref(0);
let room = "game";
let clientStatus = "client";
let clientGameState: Game;
let lobbyCreated: boolean = false;

function playerReady() {
	lobbyStatus.value = "Waiting for the other player...";
	socket.emit("playerReady", { clientGameState }, () => {});
}

const ball = ref<IBall>({
	size: 16,
	pos: { x: 200, y: 200 },
	speed: { x: 0, y: 0 },
});

onMounted(() => {
	let ctx = canvas.value?.getContext("2d");

	socket.on("yourehost", () => {
		clientStatus = "host";
	});

	socket.on("ServerUpdate", (gameState: any) => {
		console.log("Server Game update");
		ball.value = gameState.ball;
		clientScore.value = gameState.score.client;
		hostScore.value = gameState.score.host;
		if (ctx) {
			drawPlayground(ctx);
			ctx.drawImage(
				ballImg,
				ball.value.pos.x - ball.value.size,
				ball.value.pos.y - ball.value.size,
				ball.value.size * 2,
				ball.value.size * 2
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

	socket.on("lobbyCreated", (gameState) => {
		console.log("Lobby created");

		clientGameState = gameState;
		lobbyCreated = true;
		lobbyStatus.value = "Ready ?";
	});

	socket.on("startGame", (gameState) => {
		console.log("Start");

		clientGameState = gameState;
		lobbyStatus.value = "Go !";
	});

	window.addEventListener("keydown", (e) => {
		if (e.key === "ArrowLeft")
			socket.emit("key", {
				room: clientGameState.room,
				clientStatus: clientStatus,
				key: "downLeft",
			});
		else if (e.key === "ArrowRight")
			socket.emit("key", {
				room: clientGameState.room,
				clientStatus: clientStatus,
				key: "downRight",
			});
	});

	window.addEventListener("keyup", (e) => {
		if (e.key === "ArrowLeft")
			socket.emit("key", {
				room: clientGameState.room,
				clientStatus: clientStatus,
				key: "upLeft",
			});
		else if (e.key === "ArrowRight")
			socket.emit("key", {
				room: clientGameState.room,
				clientStatus: clientStatus,
				key: "upRight",
			});
	});

	window.addEventListener("keydown", (e) => {
		if (
			lobbyCreated === true &&
			clientGameState?.gameOn === false &&
			e.key === " "
		)
			playerReady();
	});
});
</script>

<style type="text/css">
button:disabled {
	opacity: 0.7;
}
</style>
