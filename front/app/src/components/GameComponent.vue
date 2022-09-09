<template>
	<h1>Score: {{ counter }}</h1>
	<button @click="players = 1">Solo</button>
	<button @click="players = 2">Multiplayer</button>
	<button @click="findMatch()" :disabled="startButton">
		{{ lobbyStatus }}
	</button>
	<canvas ref="canvas" width="500" height="500"></canvas>
</template>

<script setup lang="ts">
import ballUrl from "../assets/ball.png";
import { ref, onMounted } from "vue";
import { io } from "socket.io-client";
import { GameState } from "../../../../back/app/src/game.core";

const socket = io("http://10.19.1.249:3000");

const ballImg = new Image();
ballImg.src = ballUrl;

const canvas = ref<HTMLCanvasElement | null>(null);

class Game {
	public barMoving: boolean = false;
	public gameOn: boolean = false;
	public gameOver: boolean = false;
	public leftMovementP1: boolean = false;
	public rightMovementP1: boolean = false;
	public spaceBar: boolean = false;
	public restart: boolean = false;
	public leftMovementP2: boolean = false;
	public rightMovementP2: boolean = false;
}

const lobbyStatus = ref("Find match!");
const startButton = ref(false);
const barHeight = 10;
const barWidth = 100;
const barSpeed = 5;
const padding = 15;
let barMoving = 0;
const counter = ref(0);
let gameOn = false;
let gameOver = false;
const players = ref(1);
let leftMovement = false,
	rightMovement = false,
	spaceBar = false,
	restart = false,
	leftMovementP2 = false,
	rightMovementP2 = false;

let sGameState: GameState;
let cGameState: GameState;
let lobbyCreated: boolean = false;

interface IPoint {
	x: number;
	y: number;
}

interface IBall extends IPoint {
	speed: IPoint;
	radius: number;
	rotation: number;
}

function findMatch() {
	startButton.value = true;
	lobbyStatus.value = "Looking for an opponent...";

	socket.emit("joinQueue");
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

function ballMove(ball: IBall, topBar: IPoint, bottomBar: IPoint) {
	if (ball.x - ball.radius <= 0) {
		ball.speed.x *= -1;
		ball.x = 0 + ball.radius;
		ball.rotation = 0;
	}
	if (ball.x + ball.radius > canvas.value!.width) {
		ball.speed.x *= -1;
		ball.rotation = 0;
		ball.x = canvas.value!.width - ball.radius;
	}
	if (ball.speed.y > 0) {
		if (
			ball.y > canvas.value!.height - padding - ball.radius - barHeight ||
			ball.y <= barHeight + ball.radius + padding
		) {
			if (ball.x > topBar.x && ball.x < topBar.x + barWidth) {
				ball.speed.y *= 1.1;
				ball.speed.y *= -1;
				ball.rotation = 20 * ball.speed.y * barMoving;
				counter.value++;
			} else {
				cGameState.gameOn = false;
				gameOver = true;
			}
		}
	} else if (ball.speed.y < 0) {
		if (
			ball.y > canvas.value!.height - padding - ball.radius - barHeight ||
			ball.y <= barHeight + ball.radius + padding
		) {
			if (ball.x > bottomBar.x && ball.x < bottomBar.x + barWidth) {
				ball.speed.y *= 1.1;
				ball.speed.y *= -1;
				ball.rotation = 20 * ball.speed.y * barMoving;
				counter.value++;
			} else {
				cGameState.gameOn = false;
				gameOver = true;
			}
		}
	}

	ball.x += ball.speed.x;
	if (
		(ball.speed.x > 0 && ball.rotation > 0) ||
		(ball.speed.x < 0 && ball.rotation < 0)
	)
		ball.rotation *= -1;
	ball.x += ball.rotation / 10;
	ball.y -= ball.speed.y;
	ball.rotation *= 0.99;
}

function barMove(topBar: IPoint, bottomBar: IPoint) {
	if (players.value === 1) {
		if (leftMovement && topBar.x > 0) {
			topBar.x -= barSpeed;
			bottomBar.x -= barSpeed;
			barMoving = -1;
		}
		if (rightMovement && topBar.x < canvas.value!.width - barWidth) {
			topBar.x += barSpeed;
			bottomBar.x += barSpeed;
			barMoving = 1;
		}
	} else {
		if (leftMovement && bottomBar.x > 0) {
			bottomBar.x -= barSpeed;
			barMoving = -1;
		}
		if (rightMovement && bottomBar.x < canvas.value!.width - barWidth) {
			bottomBar.x += barSpeed;
			barMoving = 1;
		}
		if (leftMovementP2 && topBar.x > 0) {
			topBar.x -= barSpeed;
			barMoving = -1;
		}
		if (rightMovementP2 && topBar.x < canvas.value!.width - barWidth) {
			topBar.x += barSpeed;
			barMoving = 1;
		}
	}
}

function playerReady() {
	if (spaceBar && !cGameState.gameOn) {
		lobbyStatus.value = "Waiting for the other player...";
		socket.emit("playerReady", { cGameState }, () => {});
		spaceBar = false;
	}
}

function gameReset(topBar: IPoint, bottomBar: IPoint, ball: IBall) {
	if (restart) {
		topBar.x = canvas.value!.width / 2 - barWidth / 2;
		topBar.y = padding;
		bottomBar.x = canvas.value!.width / 2 - barWidth / 2;
		bottomBar.y = canvas.value!.height - barHeight - padding;
		ball.x = canvas.value!.width / 2;
		ball.y = canvas.value!.height / 2;
		ball.speed.x = 2.6;
		ball.speed.y = 2;
		ball.radius = 16;
		ball.rotation = 0;
		counter.value = 0;
		cGameState.gameOn = false;
		gameOver = false;
		restart = false;
		leftMovement = false;
		rightMovement = false;
		leftMovementP2 = false;
		rightMovementP2 = false;
		spaceBar = false;
		barMoving = 0;
	}
}

onMounted(() => {
	let ctx = canvas.value?.getContext("2d");
	if (ctx) {
		let topBar: IPoint, bottomBar: IPoint;
		let ball: IBall;

		topBar = {
			x: canvas.value!.width / 2 - barWidth / 2,
			y: padding,
		};
		bottomBar = {
			x: canvas.value!.width / 2 - barWidth / 2,
			y: canvas.value!.height - barHeight - padding,
		};
		ball = {
			x: canvas.value!.width / 2,
			y: canvas.value!.height / 2,
			speed: { x: 2.6, y: 2 },
			radius: 16,
			rotation: 0,
		};

		socket.on("lobbyCreated", (gameState) => {
			sGameState = cGameState = gameState;
			lobbyCreated = true;
			lobbyStatus.value = "Ready ?";
		});

		window.addEventListener("keydown", (e) => {
			if (e.key === "ArrowLeft") leftMovement = true;
			else if (e.key === "ArrowRight") rightMovement = true;
			else if (e.key === "a") leftMovementP2 = true;
			else if (e.key === "d") rightMovementP2 = true;
			else if (e.key === "F2") restart = true;
		});
		window.addEventListener("keyup", (e) => {
			if (e.key === "ArrowLeft") leftMovement = false;
			else if (e.key === "ArrowRight") rightMovement = false;
			else if (e.key === "a") leftMovementP2 = false;
			else if (e.key === "d") rightMovementP2 = false;
			else if (e.key === "F2") restart = false;
		});
		window.addEventListener("keydown", (e) => {
			if (
				lobbyCreated === true &&
				cGameState?.gameOn === false &&
				e.key === " "
			)
				spaceBar = true;
		});
		window.addEventListener("keydown", (e) => {
			if (e.key === "`") console.log(players);
		});

		const loop = () => {
			if (!ctx) return;
			drawPlayground(ctx);
			if (cGameState) {
				if (gameOver === true) {
					gameReset(topBar, bottomBar, ball);
				}
				if (
					spaceBar === true &&
					cGameState.gameOn === false &&
					gameOver === false
				) {
					playerReady();
				}
				socket.on("startGame", (gameState) => {
					sGameState = cGameState = gameState;
					lobbyStatus.value = "Go !";
				});
				if (cGameState.gameOn === true) {
					barMoving = 0;
					barMove(topBar, bottomBar);
					ballMove(ball, topBar, bottomBar);
				}

				// Draw the ball
				ctx.drawImage(
					ballImg,
					ball.x - ball.radius,
					ball.y - ball.radius,
					ball.radius * 2,
					ball.radius * 2
				);

				// Draw the bars
				ctx.fillStyle = "black";
				ctx.fillRect(topBar.x, topBar.y, barWidth, barHeight);
				ctx.fillRect(bottomBar.x, bottomBar.y, barWidth, barHeight);
			}
			requestAnimationFrame(loop);
		};
		requestAnimationFrame(loop);
	}
});
</script>

<style type="text/css">
button:disabled {
	opacity: 0.7;
}
</style>
