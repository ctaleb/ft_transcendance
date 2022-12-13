<template>
  <div class="playZone">
    <div class="opponent">
      <div :style="'font-size: ' + textSize + 'px;'" class="elo txt">{{ opponent.elo }}</div>
      <div :style="'font-size: ' + textSize + 'px;'" class="name txt">{{ opponent.nickname }}</div>
      <img :src="User.getAvatar(store.user!)" />
    </div>
    <canvas class="canvas" ref="canvas"> </canvas>
    <div class="us">
      <img :src="User.getAvatar(store.user!)" />
      <div :style="'font-size: ' + textSize + 'px;'" class="name txt">{{ us.nickname }}</div>
      <div :style="'font-size: ' + textSize + 'px;'" class="elo txt">{{ us.elo }}</div>
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
import plateauHUrl from "../assets/plateauhaut.png";
import plateauBUrl from "../assets/plateaubas.png";
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
const plateauHImg = new Image();
plateauHImg.src = plateauHUrl;
const plateauBImg = new Image();
plateauBImg.src = plateauBUrl;
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

const canvas = ref<HTMLCanvasElement>();
let ctx: CanvasRenderingContext2D | null | undefined;
let cHeight = 0;
let cWidth = 0;
let scale = 0;
let offset = 0;

const hostScore = ref(0);
const clientScore = ref(0);
const textSize = ref(0);

let goal = false;
let loadPercent = 120;
let kickOff = false;
let cSmashingPercent = 0;
let hSmashingPercent = 0;
let ballBouncedSide = 0;
let ballBouncedPaddle = 0;
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
  hit: { x: 0, y: 0, hit: 0 },
  state: "play",
};

let gStateRender: GameState;

const defaultGameOptions: GameOptions = {
  scoreMax: 20,
  ballSpeed: 1,
  ballSize: 1,
  barSpeed: 1,
  barSize: 1,
  smashStrength: 1,
  effects: true,
  powers: true,
  smashes: true,
};

let theRoom: GameRoom;

//DRAW FUNCTIONS

function kickoffLoading(ctx: any, gameState: GameState) {
  if (gState.state != "kickoff") {
    kickOff = false;
    loadPercent = 0;
  } else if ((gameState.state = "kickoff")) {
    if (!kickOff) {
      loadPercent = 120;
      kickOff = true;
    }
    ctx.beginPath();
    let arcsize = (loadPercent / 100) * 2 * Math.PI;
    loadPercent -= 0.6;
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

function drawinfoPlayground(ctx: CanvasRenderingContext2D) {
  ctx.drawImage(plateauHImg, 0, 0, cWidth, cHeight / 6);
  ctx.drawImage(plateauBImg, 0, cHeight - cHeight / 6, cWidth, cHeight / 6);
}

function addWallParticle(gameState: GameState) {
  const hit: particleSet = { particles: [], reach: false };
  let ab: IPoint = { x: gameState.ball.pos.x - gameState.hit.x, y: gameState.ball.pos.y - gameState.hit.y };
  let end1: IPoint = { x: gameState.hit.x < 250 ? 10 : 490, y: 1.3 * ab.x };
  let end2: IPoint = { x: gameState.hit.x < 250 ? 10 : 490, y: 1.3 * -ab.x };

  //left
  let rand;
  let randhalf;
  for (let i = 0; i < 10; i++) {
    rand = Math.random() * 10;
    randhalf = -Math.random() * 5;
    hit.particles.push({
      start: { x: gameState.hit.x < 250 ? 5 * scale : (500 - 7) * scale, y: gameState.hit.y },
      end: { x: 0 + (gameState.hit.x < 250 ? rand : randhalf), y: end1.y + rand },
      trail: [],
      color: "#edd199",
    });
  }
  for (let i = 0; i < 10; i++) {
    rand = Math.random() * 10;
    randhalf = -Math.random() * 5;
    hit.particles.push({
      start: { x: gameState.hit.x < 250 ? 5 * scale : (500 - 7) * scale, y: gameState.hit.y },
      end: { x: 0 + (gameState.hit.x < 250 ? rand : randhalf), y: end2.y + rand },
      trail: [],
      color: "#edd199",
    });
  }
  particles.length = 0;
  particles.push(hit);
}

function addGoalParticle(gameState: GameState) {
  if (!goal) {
    goal = true;
    const hit: particleSet = { particles: [], reach: false };
    let offset = gameState.hit.y < 250 ? gameState.ball.size : -gameState.ball.size;
    let end: IPoint = { x: gameState.hit.x, y: gameState.hit.y < 250 ? 90 * scale : -90 * scale };

    let rand;

    for (let i = 0; i < 10; i++) {
      rand = Math.random() * 10;
      hit.particles.push({
        start: { x: gameState.hit.x + rand, y: gameState.hit.y + offset },
        end: { x: rand, y: end.y },
        trail: [],
        color: gameState.hit.y < 250 ? "#1B90F0" : "#E01435",
      });
    }
    for (let i = 0; i < 10; i++) {
      rand = Math.random() * 10;
      hit.particles.push({
        start: { x: gameState.hit.x - rand, y: gameState.hit.y + offset },
        end: { x: -rand, y: end.y },
        trail: [],
        color: gameState.hit.y < 250 ? "#1B90F0" : "#E01435",
      });
    }
    particles.length = 0;
    particles.push(hit);
  }
}

function addBarParticle(gameState: GameState) {
  const hit: particleSet = { particles: [], reach: false };
  let bar: IBar = gameState.hit.y < 250 ? gameState.clientBar : gameState.hostBar;
  // let end: IPoint = { x: gameState.hit.y < 250 ? 90 * scale : -90 * scale, y: 0 };

  let rand;

  for (let i = 0; i < 3; i++) {
    rand = Math.random() * 50;
    hit.particles.push({
      start: { x: bar.pos.x + bar.size.x, y: bar.pos.y },
      end: { x: rand, y: 0 },
      trail: [],
      color: gameState.hit.y < 250 ? "#E01435" : "#1B90F0",
    });
  }
  for (let i = 0; i < 3; i++) {
    rand = Math.random() * 50;
    hit.particles.push({
      start: { x: bar.pos.x - bar.size.x, y: bar.pos.y },
      end: { x: -rand, y: 0 },
      trail: [],
      color: gameState.hit.y < 250 ? "#E01435" : "#1B90F0",
    });
  }
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
      let color = element.color;
      element.trail.forEach((element, index) => {
        ctx.globalAlpha = 0.1 * index;
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(element.x, element.y, 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.globalAlpha = 1;
      });
    });
  });
}
function drawScore(ctx: CanvasRenderingContext2D, gameState: GameState) {
  let slot = defaultGameOptions.scoreMax;

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
  let roundRect = (ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, r: number, color: string) => {
    var w = x1 - x0;
    var h = y1 - y0;
    if (r > w / 2) r = w / 2;
    if (r > h / 2) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x1 - r, y0);
    ctx.quadraticCurveTo(x1, y0, x1, y0 + r);
    ctx.lineTo(x1, y1 - r);
    ctx.quadraticCurveTo(x1, y1, x1 - r, y1);
    ctx.lineTo(x0 + r, y1);
    ctx.quadraticCurveTo(x0, y1, x0, y1 - r);
    ctx.lineTo(x0, y0 + r);
    ctx.quadraticCurveTo(x0, y0, x0 + r, y0);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };
  for (let i = 0; i < gameState.clientPower.currentCharge; i++) {
    let x: number = cWidth * 0.265 + ((cWidth * 0.47) / gameState.clientPower.maxCharge) * i;
    let y: number = cHeight * 0.055;
    roundRect(ctx, x, y, x + (cWidth * 0.45) / gameState.clientPower.maxCharge, y + 9 * scale, 5, "#E00");
  }
  for (let i = 0; i < gameState.hostPower.currentCharge; i++) {
    let x: number = cWidth * 0.2656 + ((cWidth * 0.47) / gameState.hostPower.maxCharge) * i;
    let y: number = cHeight * 0.932;
    roundRect(ctx, x, y, x + (cWidth * 0.45) / gameState.hostPower.maxCharge, y + 9 * scale, 5, "#00E");
  }
}
function drawBall(ctx: CanvasRenderingContext2D, gameState: GameState) {
  if (gameState.hit.hit == 1) {
    ballBouncedPaddle = 0;
    ballBouncedSide = 4;
    ctx.drawImage(
      ballImg,
      gameState.ball.pos.x - gameState.ball.size * scale,
      gameState.ball.pos.y - gameState.ball.size * scale,
      gameState.ball.size * 2 * scale * 0.6,
      gameState.ball.size * 2 * scale
    );
  } else if (ballBouncedSide > 1) {
    ctx.drawImage(
      ballImg,
      gameState.ball.pos.x - gameState.ball.size * scale,
      gameState.ball.pos.y - gameState.ball.size * scale,
      gameState.ball.size * 2 * scale * (0.7 + 0.1 * (4 - ballBouncedSide)),
      gameState.ball.size * 2 * scale
    );
    ballBouncedSide--;
  } else if (gameState.hit.hit == 2) {
    ballBouncedSide = 0;
    ballBouncedPaddle = 3;
    ctx.drawImage(
      ballImg,
      gameState.ball.pos.x - gameState.ball.size * scale,
      gameState.ball.pos.y - gameState.ball.size * scale,
      gameState.ball.size * 2 * scale,
      gameState.ball.size * 2 * scale * 0.7
    );
  } else if (ballBouncedPaddle > 1) {
    ctx.drawImage(
      ballImg,
      gameState.ball.pos.x - gameState.ball.size * scale,
      gameState.ball.pos.y - gameState.ball.size * scale,
      gameState.ball.size * 2 * scale,
      gameState.ball.size * 2 * scale * (0.8 + 0.1 * (3 - ballBouncedPaddle))
    );
    ballBouncedPaddle--;
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

//SCALING FUNCTIONS
function scaling(ctx?: CanvasRenderingContext2D | null) {
  if (ctx) {
    ctx.canvas.height = window.innerHeight - 140;
    if (ctx.canvas.height * 0.69 > window.innerWidth) {
      ctx.canvas.width = window.innerWidth;
      ctx.canvas.height = ctx.canvas.width * 1.449;
    } else {
      ctx.canvas.width = ctx.canvas.height * 0.69;
    }
    cHeight = ctx.canvas.height;
    cWidth = ctx.canvas.width;
    textSize.value = cHeight / 42;
    scale = cWidth / 500;
    offset = (cHeight - cWidth) / 2;
  }
}
function scalePosition(gameState: GameState) {
  gStateRender = JSON.parse(JSON.stringify(gameState));
  let scale = cWidth / 500;
  let offset = (cHeight - cWidth) / 2;
  gStateRender.ball.pos.x *= scale;
  gStateRender.ball.pos.y *= scale;
  gStateRender.ball.pos.y += offset;
  gStateRender.hostBar.pos.x *= scale;
  gStateRender.hostBar.pos.y *= scale;
  gStateRender.hostBar.pos.y += offset;
  gStateRender.clientBar.pos.x *= scale;
  gStateRender.clientBar.pos.y *= scale;
  gStateRender.clientBar.pos.y += offset;
  gStateRender.hit.x *= scale;
  gStateRender.hit.y *= scale;
  gStateRender.hit.y += offset;
}
function resizeCanvas() {
  scaling(ctx);
  scalePosition(gState);
  render(ctx, gStateRender);
}

// SOCKET FUNCTIONS

const registerSockets = (socket: any) => {
  !socket?.value?.hasListeners("ServerUpdate") && socket?.value?.on("ServerUpdate", ServerUpdate);
};

const unregisterSockets = (socket: any) => {
  socket?.value?.removeListener("ServerUpdate");
};

onMounted(() => {
  ctx = canvas.value?.getContext("2d");
  scaling(ctx);
  registerSockets(socketLocal);
  watch(
    () => socketLocal.value,
    () => {
      registerSockets(socketLocal);
    }
  );
  window.addEventListener("resize", resizeCanvas);
  gameLoop();
});

onUnmounted(() => {
  unregisterSockets(socketLocal);
});

function render(ctx: CanvasRenderingContext2D | null | undefined, gameState: GameState) {
  if (ctx) {
    drawPlayground(ctx);
    kickoffLoading(ctx, gameState);
    drawBall(ctx, gameState);
    ctx.fillStyle = "black";
    drawSmashingEffect(gameState.clientBar, cSmashingPercent, ctx);
    drawSmashingEffect(gameState.hostBar, hSmashingPercent, ctx);
    drawParticle(ctx, gameState);
    drawinfoPlayground(ctx);
    drawPowerCharge(ctx, gameState);
    drawScore(ctx, gameState);
  }
}

const ServerUpdate = (gameState: GameState) => {
  gState = gameState;
};

const wallBallCollision = (state: GameState) => {
  if (state.ball.pos.x - 16 <= 0) {
    state.ball.speed.x *= -1;
    state.hit.x = 0;
    state.hit.y = state.ball.pos.y;
    state.hit.hit = 1;
    state.ball.pos.x = 0 + 16;
  }
  if (state.ball.pos.x + 16 > 500) {
    state.ball.speed.x *= -1;
    state.hit.x = 500;
    state.hit.y = state.ball.pos.y;
    state.hit.hit = 1;
    state.ball.pos.x = 500 - 16;
  }
};

const predict = () => {
  gState.ball.pos.x += gState.ball.speed.x;
  gState.ball.pos.y += gState.ball.speed.y;
  wallBallCollision(gState);
  gState.frame++;
};

const particleEvent = (gameState: GameState) => {
  if (gameState.hit.hit == 1) addWallParticle(gameState);
  // else if (gameState.hit.hit == 2) addBarParticle(gameState);
  else if (gameState.hit.hit == 3) addGoalParticle(gameState);
  else goal = false;
};

const gameLoop = () => {
  let currentFrame = 0;

  let intervalId = setInterval(function () {
    if (gState.state == "end") clearInterval(intervalId);
    if (gState.frame < currentFrame && gState.state == "play") {
      predict();
    }
    if (ctx) {
      scalePosition(gState);
      particleEvent(gStateRender);
      clientScore.value = gStateRender.score.client;
      hostScore.value = gStateRender.score.host;
      if (gStateRender.clientBar.smashing && cSmashingPercent < 100 && !kickOff) {
        cSmashingPercent += 2;
      } else if (!gStateRender.clientBar.smashing || kickOff) cSmashingPercent = 0;
      if (gStateRender.hostBar.smashing && hSmashingPercent < 100 && !kickOff) {
        hSmashingPercent += 2;
      } else if (!gStateRender.hostBar.smashing || kickOff) hSmashingPercent = 0;
      render(ctx, gStateRender);
      gState.frame = currentFrame;
      currentFrame++;
    }
  }, 1000 / 60);
};
</script>
<style lang="scss" scoped>
@import "../styles/variables";
.playZone {
  position: relative;

  .opponent {
    position: absolute;
    text-overflow: ellipsis;
    width: 16%;
    height: 15.5%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    img {
      width: 81%;
      aspect-ratio: 1 / 1;
      border-radius: 10000px;
    }
  }

  .elo {
    color: $primary;
  }
  .name {
    color: black;
  }
  .us {
    position: absolute;
    text-overflow: ellipsis;
    width: 16%;
    height: 15.5%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    bottom: 6px;
    right: 0;
    img {
      width: 81%;
      aspect-ratio: 1 / 1;
      border-radius: 10000px;
    }
  }
}
</style>
