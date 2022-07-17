<template>
  <canvas ref="canvas" width="500" height="500"></canvas>
</template>

<script setup lang="ts">
import ballUrl from "../assets/ball.png";
import { ref, onMounted } from "vue";

const ballImg = new Image(); ballImg.src = ballUrl;

const canvas = ref<HTMLCanvasElement | null>(null);

const barHeight = 10;
const barWidth = 120;
const barSpeed = 3;
const padding = 15;
let counter = 0;
let gameOn = true;

let leftMovement = false,
  rightMovement = false;

interface IPoint {
  x: number;
  y: number;
}

interface IBall extends IPoint {
  speed: IPoint;
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

function ballMove(ball: IBall, topBar: IPoint) {
  if (ball.x > canvas.value!.width || ball.x <= 0) {
    ball.speed.x *= -1;
  }
  if (ball.y > canvas.value!.height - padding - ball.radius || ball.y <= barHeight + ball.radius) {
    if (ball.x > topBar.x && ball.x < topBar.x + barWidth) {
      ball.speed.y *= -1;
      counter++;
    }
    else
      gameOn = false;
  }

  ball.x += ball.speed.x;
  ball.y -= ball.speed.y;
}

function barMove(topBar: IPoint, bottomBar: IPoint) {
  if (leftMovement && topBar.x > 0) {
    topBar.x -= barSpeed;
    bottomBar.x -= barSpeed;
  }
  if (rightMovement && topBar.x < canvas.value!.width - barWidth) {
    topBar.x += barSpeed;
    bottomBar.x += barSpeed;
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
          barMove(topBar, bottomBar);
          ballMove(ball, topBar);
        }

        // Draw the ball
        ctx.drawImage(ballImg, ball.x - ball.radius, ball.y - ball.radius, ball.radius * 2, ball.radius * 2);

        // Draw the bars
        ctx.fillStyle = "black";
        ctx.fillRect(topBar.x, topBar.y, barWidth, barHeight);
        ctx.fillRect(bottomBar.x, bottomBar.y, barWidth, barHeight);

        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  }
});
</script>

