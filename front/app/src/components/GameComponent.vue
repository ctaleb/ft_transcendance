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

<script setup lang="ts">
import ballUrl from "../assets/ball.png";
import paddleUrl from "../assets/paddle_grec.png";
import energyUrl from "../assets/energy.png";
import paddleEnergyUrl from "../assets/energy_paddle_grec.png";
import plateauUrl from "../assets/plateau.png";
import energyRedUrl from "../assets/energy_red.png";
import paddleRedUrl from "../assets/paddle_grec_red.png";
import paddleEnergyRedUrl from "../assets/energy_paddle_red.png";
import { ref, onMounted, onBeforeMount } from "vue";
import { io } from "socket.io-client";
import {
	GameState,
	GameRoom,
	IBall,
	IBar,
	IPoint,
} from "../../../../back/app/src/chat/entities/message.entity";

const socket = io("http://" + window.location.hostname + ":3000");
const ballImg = new Image();
ballImg.src = ballUrl;
const paddleImg = new Image();
paddleImg.src = paddleUrl;
const energyPaddleImg = new Image();
energyPaddleImg.src = paddleEnergyUrl;
const plateauImg = new Image();
plateauImg.src = plateauUrl;
const energyImg = new Image();
energyImg.src = energyUrl;
const energyPaddleRedImg = new Image();
energyPaddleRedImg.src = paddleEnergyRedUrl;
const energyRedImg = new Image();
energyRedImg.src = energyRedUrl;
const paddleRedImg = new Image();
paddleRedImg.src = paddleRedUrl;

const canvas = ref<HTMLCanvasElement | null>(null);

const startButton = ref(false);
const lobbyStatus = ref("Find match");
const hostScore = ref(0);
const clientScore = ref(0);
let loadPercent = 120;
let kickOff = false;
let cSmashingPercent = 0;
let hSmashingPercent = 0;

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
	ctx.drawImage(plateauImg, 0, 0, 500, 500);
}

function kickoffLoading(ctx: any) {
	if (kickOff) {
		ctx.beginPath();
		let arcsize = (loadPercent / 100) * 2 * Math.PI;
		loadPercent -= 0.4;
		if (arcsize < 1) return;
		ctx.arc(250, 250, 20, 1, arcsize);
		ctx.strokeStyle = "#7AD3FA";
		ctx.lineWidth = 4;
		ctx.stroke();
	}
}

function drawSmashingEffect(
	bar: IBar,
	smashingPercent: number,
	ctx: CanvasRenderingContext2D
) {
	if (bar.smashing) {
		ctx.drawImage(
			bar.pos.y < 250 ? energyPaddleRedImg : energyPaddleImg,
			bar.pos.x - bar.size.x,
			bar.pos.y - bar.size.y * (1 + smashingPercent / 100 / 2),
			bar.size.x * 2,
			bar.size.y * (2 + smashingPercent / 100)
		);
	}
	if (bar.smashing) {
		ctx.globalAlpha = (0.5 * smashingPercent) / 100;
		ctx.drawImage(
			bar.pos.y < 250 ? energyRedImg : energyImg,
			bar.pos.x - bar.size.x * 2.5,
			bar.pos.y - bar.size.y * 4,
			bar.size.x * 5,
			bar.size.y * 8
		);
		ctx.globalAlpha = 1;
	}
	ctx.drawImage(
		bar.pos.y < 250 ? paddleRedImg : paddleImg,
		bar.pos.x - bar.size.x,
		bar.pos.y - bar.size.y,
		bar.size.x * 2,
		bar.size.y * 2
	);
}

onMounted(() => {
	let ctx = canvas.value?.getContext("2d");

	socket.on("gameConfirmation", (gameRoom: GameRoom) => {
		theRoom = gameRoom;
		openModal();
	});

	socket.on("kickOff", () => {
		kickOff = true;
	});

	socket.on("play", () => {
		kickOff = false;
		loadPercent = 120;
	});

	socket.on("ServerUpdate", (gameState: GameState) => {
		let ball = gameState.ball;
		clientScore.value = gameState.score.client;
		hostScore.value = gameState.score.host;
		if (gameState.clientBar.smashing && cSmashingPercent < 100 && !kickOff) {
			cSmashingPercent += 2;
		} else if (!gameState.clientBar.smashing || kickOff) cSmashingPercent = 0;
		if (gameState.hostBar.smashing && hSmashingPercent < 100 && !kickOff) {
			hSmashingPercent += 2;
		} else if (!gameState.hostBar.smashing || kickOff) hSmashingPercent = 0;
		if (ctx) {
			drawPlayground(ctx);
			kickoffLoading(ctx);
			ctx.drawImage(
				ballImg,
				ball.pos.x - ball.size,
				ball.pos.y - ball.size,
				ball.size * 2,
				ball.size * 2
			);
			ctx.fillStyle = "black";
			drawSmashingEffect(gameState.clientBar, cSmashingPercent, ctx);
			drawSmashingEffect(gameState.hostBar, hSmashingPercent, ctx);
		}
	});

	socket.on("Win", (gameRoom: GameRoom) => {
		theRoom = gameRoom;
		lobbyStatus.value = "Victory !";
	});

	socket.on("Lose", (gameRoom: GameRoom) => {
		theRoom = gameRoom;
		lobbyStatus.value = "Defeat...";
	});

	socket.on("startGame", (gameRoom: GameRoom) => {
		theRoom = gameRoom;
		lobbyStatus.value = "Play !";
	});

	window.addEventListener("keydown", (e) => {
		if (theRoom.status === "playing") {
			if (e.key === "ArrowLeft")
				socket.emit("key", {
					key: "downLeft",
				});
			else if (e.key === "ArrowRight")
				socket.emit("key", {
					key: "downRight",
				});
			if (e.key === "a")
				socket.emit("key", {
					key: "downA",
				});
			else if (e.key === "d")
				socket.emit("key", {
					key: "downD",
				});
		}
	});

	window.addEventListener("keyup", (e) => {
		if (theRoom.status === "playing") {
			if (e.key === "ArrowLeft")
				socket.emit("key", {
					key: "upLeft",
				});
			else if (e.key === "ArrowRight")
				socket.emit("key", {
					key: "upRight",
				});
			if (e.key === "a")
				socket.emit("key", {
					key: "upA",
				});
			else if (e.key === "d")
				socket.emit("key", {
					key: "upD",
				});
		}
	});
});
</script>

<style type="text/css">
button:disabled {
	opacity: 0.7;
}
</style>
