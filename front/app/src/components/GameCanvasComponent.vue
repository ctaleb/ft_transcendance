<template>
  <div>
    <div class="opponent">
      <img :src="User.getAvatar(opponent)" />
      <h4>{{ opponent.nickname }}</h4>
      <h4>{{ opponent.elo }}</h4>
    </div>
    <canvas ref="canvas"></canvas>
    <div class="us">
      <img :src="User.getAvatar(us)" />
      <h4>{{ us.nickname }}</h4>
      <h4>{{ us.elo }}</h4>
    </div>
  </div>
</template>

<script setup lang="ts">
import { socketLocal, useStore } from "@/store";
import { GameOptions, GameRoom, GameState, IBar, IPoint, particleSet } from "@/types/Game";
import { User } from "@/types/User";
import { onMounted, onUnmounted, ref, watch } from "vue";
import ballUrl from "../assets/ball.png";
import energyUrl from "../assets/energy.png";
import paddleEnergyUrl from "../assets/energy_paddle_grec.png";
import paddleEnergyRedUrl from "../assets/energy_paddle_red.png";
import energyRedUrl from "../assets/energy_red.png";
import fillUrl from "../assets/fill_slot.png";
import paddleUrl from "../assets/paddle_grec.png";
import paddleRedUrl from "../assets/paddle_grec_red.png";
import plateauUrl from "../assets/plateauV2.png";
import powerChargeUrl from "../assets/powerCharge.png";
import slotUrl from "../assets/slot.png";
import fillRedUrl from "../assets/slot_fill_enemy.png";

const store = useStore();

const props = defineProps<{
  opponent: User;
  us: User;
  gameOptions: GameOptions;
}>();

const ballImg = new Image();
ballImg.src = ballUrl;
const powerChargeImg = new Image();
powerChargeImg.src = powerChargeUrl;
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
const slotImg = new Image();
slotImg.src = slotUrl;
const fillImg = new Image();
fillImg.src = fillUrl;
const fillRedImg = new Image();
fillRedImg.src = fillRedUrl;

const canvas = ref<HTMLCanvasElement | null>(null);
let ctx: CanvasRenderingContext2D | null | undefined;
let cHeight = 0;
let cWidth = 0;
let scale = 0;
let offset = 0;

const hostScore = ref(0);
const clientScore = ref(0);

const playing = false;

let gameOpts: GameOptions;

let loadPercent = 120;
let kickOff = false;
let cSmashingPercent = 0;
let hSmashingPercent = 0;
let ballBouncedSide = 0;
const particles: particleSet[] = [];

let gState: GameState = {
  frame: 0,
  ball: {
    size: 16,
    pos: { x: 250, y: 250 },
    speed: { x: 2, y: 2 },
  },
  hostPower: { maxCharge: 8, currentCharge: 0, isActive: false },
  clientPower: { maxCharge: 8, currentCharge: 0, isActive: false },
  hostBar: {
    size: { x: 50, y: 10 },
    pos: { x: 250, y: 460 },
    speed: 0,
    smashing: false,
    maxSpeed: 1,
  },
  clientBar: {
    size: { x: 50, y: 10 },
    pos: { x: 250, y: 40 },
    speed: 0,
    smashing: false,
    maxSpeed: 1,
  },
  score: {
    client: 0,
    host: 0,
  },
  hit: { x: 0, y: 0, hit: false },
};

let theRoom: GameRoom;

//DRAW FUNCTIONS

function kickoffLoading(ctx: any) {
  if (kickOff) {
    ctx.beginPath();
    let arcsize = (loadPercent / 100) * 2 * Math.PI;
    loadPercent -= 0.4;
    if (arcsize < 1) return;
    ctx.arc(cWidth / 2, cWidth / 2 + offset, 20 * scale, 1, arcsize);
    ctx.strokeStyle = "#5eadde";
    ctx.lineWidth = 4 * scale;
    ctx.stroke();
  }
}
function drawSmashingEffect(bar: IBar, smashingPercent: number, ctx: CanvasRenderingContext2D) {
  if (bar.smashing) {
    ctx.drawImage(
      bar.pos.y < 250 ? energyPaddleRedImg : energyPaddleImg,
      bar.pos.x - bar.size.x * scale,
      bar.pos.y - bar.size.y * scale * (1 + smashingPercent / 100 / 2),
      bar.size.x * 2 * scale,
      bar.size.y * (2 + smashingPercent / 100) * scale
    );
  }
  if (bar.smashing) {
    ctx.globalAlpha = (0.5 * smashingPercent) / 100;
    ctx.drawImage(
      bar.pos.y < 250 ? energyRedImg : energyImg,
      bar.pos.x - bar.size.x * scale * 2.5,
      bar.pos.y - bar.size.y * scale * 4,
      bar.size.x * 5 * scale,
      bar.size.y * 8 * scale
    );
    ctx.globalAlpha = 1;
  }
  ctx.drawImage(
    bar.pos.y < 250 ? paddleRedImg : paddleImg,
    bar.pos.x - bar.size.x * scale,
    bar.pos.y - bar.size.y * scale,
    bar.size.x * 2 * scale,
    bar.size.y * 2 * scale
  );
}
function drawPlayground(ctx: CanvasRenderingContext2D) {
  ctx.drawImage(plateauImg, 0, 0, cWidth, cHeight);
}
function addParticle(ctx: CanvasRenderingContext2D, gameState: GameState) {
  const hit: particleSet = { particles: [], reach: false };
  let ab: IPoint = { x: gameState.ball.pos.x - gameState.hit.x, y: gameState.ball.pos.y - gameState.hit.y };
  let end1: IPoint = { x: gameState.hit.x < 250 ? 10 : 490, y: 1.3 * ab.x };
  let end2: IPoint = { x: gameState.hit.x < 250 ? 10 : 490, y: 1.3 * -ab.x };

  //left
  hit.particles.push({
    start: { x: gameState.hit.x < 250 ? 5 * scale : (500 - 7) * scale, y: gameState.hit.y },
    end: { x: 0, y: end1.y },
    trail: [],
  });
  hit.particles.push({
    start: { x: gameState.hit.x < 250 ? 5 * scale : (500 - 7) * scale, y: gameState.hit.y },
    end: { x: 0 + (gameState.hit.x < 250 ? Math.random() * 10 : -(Math.random() * 5)), y: end1.y + Math.random() * 10 },
    trail: [],
  });
  hit.particles.push({
    start: { x: gameState.hit.x < 250 ? 5 * scale : (500 - 7) * scale, y: gameState.hit.y },
    end: { x: 0 + (gameState.hit.x < 250 ? Math.random() * 10 : -(Math.random() * 5)), y: end1.y + Math.random() * 10 },
    trail: [],
  });
  hit.particles.push({
    start: { x: gameState.hit.x < 250 ? 5 * scale : (500 - 7) * scale, y: gameState.hit.y },
    end: { x: 0 + (gameState.hit.x < 250 ? Math.random() * 10 : -(Math.random() * 5)), y: end1.y + Math.random() * 10 },
    trail: [],
  });
  //right
  hit.particles.push({
    start: { x: gameState.hit.x < 250 ? 5 * scale : (500 - 7) * scale, y: gameState.hit.y },
    end: { x: 0 + (gameState.hit.x < 250 ? Math.random() * 10 : -(Math.random() * 5)), y: end2.y + Math.random() * 10 },
    trail: [],
  });
  hit.particles.push({
    start: { x: gameState.hit.x < 250 ? 5 * scale : (500 - 7) * scale, y: gameState.hit.y },
    end: { x: 0 + (gameState.hit.x < 250 ? Math.random() * 10 : -(Math.random() * 5)), y: end2.y + Math.random() * 10 },
    trail: [],
  });
  hit.particles.push({
    start: { x: gameState.hit.x < 250 ? 5 * scale : (500 - 7) * scale, y: gameState.hit.y },
    end: { x: 0 + (gameState.hit.x < 250 ? Math.random() * 10 : -(Math.random() * 5)), y: end2.y + Math.random() * 10 },
    trail: [],
  });
  hit.particles.push({
    start: { x: gameState.hit.x < 250 ? 5 * scale : (500 - 7) * scale, y: gameState.hit.y },
    end: { x: 0 + (gameState.hit.x < 250 ? Math.random() * 10 : -(Math.random() * 5)), y: end2.y + Math.random() * 10 },
    trail: [],
  });
  particles.push(hit);
}
function drawParticle(ctx: CanvasRenderingContext2D, gameState: GameState) {
  particles.forEach((elemento) => {
    if (elemento.particles[0].trail.length == 10) elemento.reach = true;
    elemento.particles.forEach((element, index, tab) => {
      let i: number;

      i = element.trail.length;
      if (elemento.reach == false) {
        if (i < 10) {
          element.trail.push({ x: element.start.x + (element.end.x / 10) * i, y: element.start.y + (element.end.y / 10) * i });
        }
      } else {
        if (i > 0) element.trail.splice(0, 1);
        else tab.splice(1, 0);
      }
      element.trail.forEach((element, index) => {
        ctx.globalAlpha = 0.1 * index;
        ctx.beginPath();
        ctx.fillStyle = "#edd199";
        ctx.arc(element.x, element.y, 1, 0, 2 * Math.PI);
        ctx.fill();
        ctx.globalAlpha = 1;
      });
    });
  });
}
function drawScore(ctx: CanvasRenderingContext2D, gameState: GameState) {
  let slot = theRoom.options.scoreMax;

  for (let i = 0; i < slot; i++) {
    ctx.drawImage(slotImg, cWidth * 0.25 + ((cWidth * 0.5) / (slot + 1)) * (i + 1) - 10 * scale, cHeight * 0.148 - 25 * scale, 20 * scale, 20 * scale);
    if (i < gameState.score.client)
      ctx.drawImage(
        fillRedImg,
        cWidth * 0.25 + ((cWidth * 0.5) / (slot + 1)) * (i + 1) - 6 * scale,
        cHeight * 0.148 - 25 * scale + (8 * scale) / 2,
        12 * scale,
        12 * scale
      );
  }
  for (let i = 0; i < slot; i++) {
    ctx.drawImage(slotImg, cWidth * 0.25 + ((cWidth * 0.5) / (slot + 1)) * (i + 1) - 10 * scale, cHeight * 0.894 - 25 * scale, 20 * scale, 20 * scale);
    if (i < gameState.score.host)
      ctx.drawImage(
        fillImg,
        cWidth * 0.25 + ((cWidth * 0.5) / (slot + 1)) * (i + 1) - 6 * scale,
        cHeight * 0.894 - 25 * scale + (8 * scale) / 2,
        12 * scale,
        12 * scale
      );
  }
}
function drawPowerCharge(ctx: CanvasRenderingContext2D, gameState: GameState) {
  for (let i = 0; i < gameState.clientPower.currentCharge; i++) {
    ctx.drawImage(
      powerChargeImg,
      cWidth * 0.265 + ((cWidth * 0.47) / gameState.clientPower.maxCharge) * i,
      cHeight * 0.055,
      (cWidth * 0.45) / gameState.clientPower.maxCharge,
      9 * scale
    );
  }
  for (let i = 0; i < gameState.hostPower.currentCharge; i++) {
    ctx.drawImage(
      powerChargeImg,
      cWidth * 0.2656 + ((cWidth * 0.47) / gameState.hostPower.maxCharge) * i,
      cHeight * 0.931,
      (cWidth * 0.45) / gameState.hostPower.maxCharge,
      9 * scale
    );
  }
}
function drawBall(ctx: CanvasRenderingContext2D, gameState: GameState) {
  if (gameState.hit.hit) {
    ballBouncedSide = 3;
    ctx.drawImage(
      ballImg,
      gameState.ball.pos.x - gameState.ball.size * scale,
      gameState.ball.pos.y - gameState.ball.size * scale,
      gameState.ball.size * 2 * scale * 0.7,
      gameState.ball.size * 2 * scale
    );
  } else if (ballBouncedSide > 0) {
    ctx.drawImage(
      ballImg,
      gameState.ball.pos.x - gameState.ball.size * scale,
      gameState.ball.pos.y - gameState.ball.size * scale,
      gameState.ball.size * 2 * scale * 0.8 + 0.1 * (3 - ballBouncedSide),
      gameState.ball.size * 2 * scale
    );
    ballBouncedSide--;
  } else {
    ctx.drawImage(
      ballImg,
      gameState.ball.pos.x - gameState.ball.size * scale,
      gameState.ball.pos.y - gameState.ball.size * scale,
      gameState.ball.size * 2 * scale,
      gameState.ball.size * 2 * scale
    );
  }
}

const kickOfff = () => {
  kickOff = true;
};

const play = () => {
  kickOff = false;
  loadPercent = 120;
};

//SCALING FUNCTIONS

function scaling(ctx?: CanvasRenderingContext2D | null) {
  if (ctx) {
    ctx.canvas.height = window.innerHeight * 0.8;
    if (ctx.canvas.height * 0.69 > window.innerWidth) {
      ctx.canvas.width = window.innerWidth;
      ctx.canvas.height = ctx.canvas.width * 1.449;
    } else {
      ctx.canvas.width = ctx.canvas.height * 0.69;
    }
    cHeight = ctx.canvas.height;
    cWidth = ctx.canvas.width;
    scale = cWidth / 500;
    offset = (cHeight - cWidth) / 2;
  }
}
function scalePosition(gameState: GameState) {
  let scale = cWidth / 500;
  let offset = (cHeight - cWidth) / 2;
  gameState.ball.pos.x *= scale;
  gameState.ball.pos.y *= scale;
  gameState.ball.pos.y += offset;
  gameState.hostBar.pos.x *= scale;
  gameState.hostBar.pos.y *= scale;
  gameState.hostBar.pos.y += offset;
  gameState.clientBar.pos.x *= scale;
  gameState.clientBar.pos.y *= scale;
  gameState.clientBar.pos.y += offset;
  gameState.hit.x *= scale;
  gameState.hit.y *= scale;
  gameState.hit.y += offset;
}
function resizeCanvas() {
  scaling(ctx);
  rerender(ctx, gState);
}

// SOCKET FUNCTIONS

const registerSockets = (socket: any) => {
  !socket?.value?.hasListeners("kickOff") && socket?.value?.on("kickOff", kickOfff);
  !socket?.value?.hasListeners("play") && socket?.value?.on("play", play);
  !socket?.value?.hasListeners("ServerUpdate") && socket?.value?.on("ServerUpdate", ServerUpdate);
};

const unregisterSockets = (socket: any) => {
  socket?.value?.removeListener("kickOff");
  socket?.value?.removeListener("play");
  socket?.value?.removeListener("ServerUpdate");
};

onMounted(() => {
  ctx = canvas.value?.getContext("2d");
  ctx?.drawImage(plateauImg, 0, 0, cWidth, cHeight);
  scaling(ctx);
  registerSockets(socketLocal);

  watch(
    () => socketLocal.value,
    () => {
      registerSockets(socketLocal);
    }
  );
  window.addEventListener("resize", resizeCanvas);
});

onUnmounted(() => {
  unregisterSockets(socketLocal);
});

function rerender(ctx: CanvasRenderingContext2D | null | undefined, gameState: GameState) {
  if (theRoom && ctx) {
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
      drawScore(ctx, gameState);
      kickoffLoading(ctx);
      drawBall(ctx, gameState);
      ctx.fillStyle = "black";
      drawSmashingEffect(gameState.clientBar, cSmashingPercent, ctx);
      drawSmashingEffect(gameState.hostBar, hSmashingPercent, ctx);
    }
  }
}

const ServerUpdate = (gameState: GameState) => {
  gState = gameState;
};

const predict = () => {
  if (gState.hit.hit) gState.hit.hit = false;
  gState.ball.pos.x += gState.ball.speed.x;
  gState.ball.pos.y += gState.ball.speed.y;
  gState.frame++;
};

const gameLoop = () => {
  let currentFrame = 0;
  let previousFrame = 0;

  setInterval(function () {
    if (gState.frame != currentFrame) {
      predict();
    }
    if (ctx) {
      scalePosition(gState);
      clientScore.value = gState.score.client;
      hostScore.value = gState.score.host;
      if (gState.clientBar.smashing && cSmashingPercent < 100 && !kickOff) {
        cSmashingPercent += 2;
      } else if (!gState.clientBar.smashing || kickOff) cSmashingPercent = 0;
      if (gState.hostBar.smashing && hSmashingPercent < 100 && !kickOff) {
        hSmashingPercent += 2;
      } else if (!gState.hostBar.smashing || kickOff) hSmashingPercent = 0;
      drawPlayground(ctx);
      drawScore(ctx, gState);
      drawPowerCharge(ctx, gState);
      kickoffLoading(ctx);
      drawBall(ctx, gState);
      ctx.fillStyle = "black";
      drawSmashingEffect(gState.clientBar, cSmashingPercent, ctx);
      drawSmashingEffect(gState.hostBar, hSmashingPercent, ctx);
      drawParticle(ctx, gState);
      previousFrame = currentFrame;
      currentFrame++;
    }
  }, 1000 / 60);
};
</script>
<style lang="scss" scoped></style>
