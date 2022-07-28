<template>
  <canvas ref="canvas" width="500" height="500"></canvas>
</template>

<script setup lang="ts">
import ballUrl from "../assets/ball.png";
import { ref, onMounted } from "vue";

const ballImg = new Image(); ballImg.src = ballUrl;

const canvas = ref<HTMLCanvasElement | null>(null);

let leftMovement = false,
  rightMovement = false;
let gameOn = true;
let padding = 15;
let counter = 0;

interface IPoint {
  x: number;
  y: number;
}

interface IBall extends IPoint {
  speed: IPoint;
  radius: number;
  rotation: number;
}

interface IBar {
	height: number;
	width: number;
	padding: number;
	speed: number;
	moving: number;
	counter: number;
	gameOn: boolean;
	topLeftCorner: IPoint;
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

function ballMove(ball: IBall, topBar: IPoint) {
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
  if (ball.y > canvas.value!.height - padding - ball.radius - topBar.height || ball.y <= topBar.height + ball.radius + padding) {
    if (ball.x > topBar.x && ball.x < topBar.x + topBar.width) {
      ball.speed.y *= 1.1;
      ball.speed.y *= -1;
      ball.rotation = (20 * ball.speed.y) * topBar.moving;
      counter++;
    }
    else
      gameOn = false;
  }

  ball.x += ball.speed.x
  if (ball.speed.x > 0 && ball.rotation > 0 || ball.speed.x < 0 && ball.rotation < 0)
    ball.rotation *= -1;
  ball.x += ball.rotation / 10;
  ball.y -= ball.speed.y;
  ball.rotation *= 0.99;
}

function barMove(topBar: IPoint, bottomBar: IPoint) {
 // topBar.speed *= 1.1;
 // bottomBar.speed *= 1.1;
  if (leftMovement && topBar.x > 0) {
    topBar.x -= topBar.speed;
    bottomBar.x -= bottomBar.speed;
    topBar.moving = -1;
    bottomBar.moving = -1;
  }
  if (rightMovement && topBar.x < canvas.value!.width - topBar.width) {
    topBar.x += topBar.speed;
    bottomBar.x += topBar.speed;
    topBar.moving = -1;
    bottomBar.moving = -1;
  }
}

onMounted(() => {
  let ctx = canvas.value?.getContext("2d");
  if (ctx) {
    console.log("coucou");
    console.trace();
    let topBar: IBar, bottomBar: IBar;
    let ball: IBall;

    topBar = {
      height: 10,
      width: 100,
      speed: 5,
      moving: 0,
//      counter: 0, moved as global, no sense to have a counter per bar
      x: canvas.value!.width / 2 - 100 / 2,
      y: 15,
    };
    bottomBar = {
      height: 10,
      width: 100,
      speed: 5,
      moving: 0,
 //     counter: 0,
      x: canvas.value!.width / 2 - 100 / 2,
      y: canvas.value!.height - 10 - 15,
    };
    ball = {
      x: canvas.value!.width / 2,
      y: canvas.value!.height / 2,
      speed: { x: 2.6, y: 2 },
      radius: 16,
      rotation: 0,
    };

    if (ctx) {
      window.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") leftMovement = true;
        else if (e.key === "ArrowRight") rightMovement = true;
      });
      window.addEventListener("keyup", (e) => {
        if (e.key === "ArrowLeft") leftMovement = false;
        else if (e.key === "ArrowRight") rightMovement = false;
      });

      const loop = () => {
        if (!ctx)
          return;
        drawPlayground(ctx);

        if (gameOn === true) {
          topBar.Moving = 0;
          bottomBar.Moving = 0;
          barMove(topBar, bottomBar);
          ballMove(ball, topBar);
        }

        // Draw the ball
        ctx.drawImage(ballImg, ball.x - ball.radius, ball.y - ball.radius, ball.radius * 2, ball.radius * 2);

        // Draw the bars
        ctx.fillStyle = "black";
        ctx.fillRect(topBar.x, topBar.y, topBar.width, topBar.height);
        ctx.fillRect(bottomBar.x, bottomBar.y, bottomBar.width, bottomBar.height);

        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  }
});
</script>

