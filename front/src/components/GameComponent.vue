<template>
  <canvas ref="canvas" width="500" height="500"></canvas>
</template>

<script setup lang="ts">
import ballUrl from "../assets/ball.png";
import { ref, onMounted } from "vue";

const ballImg = new Image(); ballImg.src = ballUrl;

const canvas = ref<HTMLCanvasElement | null>(null);

const barHeight = 10;
const barWidth = 100;
const barSpeed = 5;
const padding = 15;
let barMoving = 0;
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
  rotation: number;
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
  if (ball.y > canvas.value!.height - padding - ball.radius - barHeight || ball.y <= barHeight + ball.radius + padding) {
    if (ball.x > topBar.x && ball.x < topBar.x + barWidth) {
      ball.speed.y *= 1.1;
      ball.speed.y *= -1;
      ball.rotation = (20 * ball.speed.y) * barMoving;
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
          barMoving = 0;
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

