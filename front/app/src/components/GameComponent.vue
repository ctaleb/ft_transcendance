<template>
	<!-- <body> -->
	<div v-if="!joined">
		<form @submit.prevent="join">
			<label>Enter your name</label>
			<input v-model="name" />
			<button type="submit">Join</button>
		</form>
	</div>
	<div class="game-container" v-else>
		<canvas ref="canvas" width="500" height="500"></canvas>
	</div>
	<!-- </body> -->
</template>

<script setup lang="ts">
import ballUrl from "../assets/ball.png";
import { ref, onMounted, onBeforeMount } from "vue";
import { io } from "socket.io-client";
import { getBaseTransformPreset } from "@vue/compiler-core";

const socket = io("http://10.2.12.4:3000");

const ballImg = new Image();
ballImg.src = ballUrl;

const canvas = ref<HTMLCanvasElement | null>(null);

interface IPoint {
	x: number;
	y: number;
}

interface IBall extends IPoint {
	radius: number;
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

// function gameReset(topBar: IPoint, bottomBar: IPoint, ball: IBall) {
// 	if (restart) {
// 		topBar.x = canvas.value!.width / 2 - barWidth / 2;
// 		topBar.y = padding;
// 		bottomBar.x = canvas.value!.width / 2 - barWidth / 2;
// 		bottomBar.y = canvas.value!.height - barHeight - padding;
// 		ball.x = canvas.value!.width / 2;
// 		ball.y = canvas.value!.height / 2;
// 		ball.speed.x = 2.6;
// 		ball.speed.y = 2;
// 		ball.radius = 16;
// 		ball.rotation = 0;
// 		counter.value = 0;
// 		gameOn = false;
// 		gameOver = false;
// 		restart = false;
// 		leftMovement = false;
// 		rightMovement = false;
// 		leftMovementP2 = false;
// 		rightMovementP2 = false;
// 		spaceBar = false;
// 		barMoving = 0;
// 	}
// }

let ctx = canvas.value?.getContext("2d");

const joined = ref(false);
const name = ref("");

let start: IPoint;
start = {
	x: 500 / 2,
	y: 500 / 2,
};
const ball = ref<IPoint>(start);

onBeforeMount(() => {
	socket.emit("update", {}, (response) => {
		console.log("trying to update");
		ball.value = response;
		if (ctx) {
			drawPlayground(ctx);

			// Draw the ball
			ctx.drawImage(
				ballImg,
				ball.value.x - 16,
				ball.value.y - 16,
				16 * 2,
				16 * 2
			);
		}
	});
});

// onMounted(() => {
// 	if (joined) {
// 		if (ctx) {
// 			// window.addEventListener("keydown", (e) => {
// 			// 	if (e.key === "ArrowLeft") leftMovement = true;
// 			// 	else if (e.key === "ArrowRight") rightMovement = true;
// 			// 	else if (e.key === "a") leftMovementP2 = true;
// 			// 	else if (e.key === "d") rightMovementP2 = true;
// 			// 	else if (e.key === "F2") restart = true;
// 			// });
// 			// window.addEventListener("keyup", (e) => {
// 			// 	if (e.key === "ArrowLeft") leftMovement = false;
// 			// 	else if (e.key === "ArrowRight") rightMovement = false;
// 			// 	else if (e.key === "a") leftMovementP2 = false;
// 			// 	else if (e.key === "d") rightMovementP2 = false;
// 			// 	else if (e.key === "F2") restart = false;
// 			// });
// 			// if (gameOn === false) {
// 			// 	window.addEventListener("keydown", (e) => {
// 			// 		if (e.key === " ") spaceBar = true;
// 			// 	});
// 			// 	window.addEventListener("keyup", (e) => {
// 			// 		if (e.key === " ") spaceBar = false;
// 			// 	});
// 			// }
// 			// window.addEventListener("keydown", (e) => {
// 			// 	if (e.key === "`") console.log(players);
// 			// });

// 			const loop = () => {
// 				if (!ctx) return;
// 				drawPlayground(ctx);

// 				// Draw the ball
// 				ctx.drawImage(
// 					ballImg,
// 					ball.value.x - 16,
// 					ball.value.y - 16,
// 					16 * 2,
// 					16 * 2
// 				);

// 				// Draw the bars
// 				// ctx.fillStyle = "black";
// 				// ctx.fillRect(topBar.x, topBar.y, barWidth, barHeight);
// 				// ctx.fillRect(bottomBar.x, bottomBar.y, barWidth, barHeight);

// 				requestAnimationFrame(loop);
// 			};
// 			requestAnimationFrame(loop);
// 		}
// 	}
// });

const join = () => {
	socket.emit("join", { name: name.value }, () => {
		joined.value = true;
	});
};
</script>
