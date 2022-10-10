<template>
  <PowerSliderComponent />
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
  <div class="sumModal hidden">
    <div class="summary" id="summary">
      <div class="playerCol">
        <div class="score">
          <div>{{ gameSummary.hostScore }}</div>
        </div>
        <div class="playerName">{{ gameSummary.hostName }}</div>
        <div class="player">
          <div class="elo"><div class="playerImage"></div></div>
          <div class="elo">
            <div>{{ gameSummary.hostElo }} elo</div>
            <div>+ {{ gameSummary.eloChange }}</div>
          </div>
        </div>
        <div class="power">
          <div>{{ gameSummary.hostPower }}</div>
        </div>
      </div>
      <div class="midcol">
        <div class="titleVictory">
          <div id="title">
            {{ sumTitle }}
            <div class="date">
              {{ sumDate }}
            </div>
          </div>
          <div class="time">{{ sumTime }}</div>
        </div>
        <div class="versus">VS</div>
        <button @click="closeSummary()">Close</button>
      </div>
      <div class="playerCol">
        <div class="score">
          <div>{{ gameSummary.clientScore }}</div>
        </div>
        <div class="playerName">{{ gameSummary.clientName }}</div>
        <div class="player">
          <div class="elo">
            <div>{{ gameSummary.clientElo }} elo</div>
            <div>+ {{ gameSummary.eloChange }}</div>
          </div>
          <div class="elo"><div class="playerImage"></div></div>
        </div>
        <div class="power">
          <div>{{ gameSummary.clientPower }}</div>
        </div>
      </div>
    </div>
  </div>
  <div class="overlay hidden"></div>
</template>

<style lang="scss">
@import "../style/summary.scss";
</style>

<script setup lang="ts">
import ballUrl from "../assets/ball.png";
import paddleUrl from "../assets/paddle_grec.png";
import energyUrl from "../assets/energy.png";
import paddleEnergyUrl from "../assets/energy_paddle_grec.png";
import plateauUrl from "../assets/plateau.png";
import energyRedUrl from "../assets/energy_red.png";
import paddleRedUrl from "../assets/paddle_grec_red.png";
import paddleEnergyRedUrl from "../assets/energy_paddle_red.png";
import slotUrl from "../assets/slot.png";
import fillUrl from "../assets/fill_slot.png";
import fillRedUrl from "../assets/slot_fill_enemy.png";
import { ref, reactive, onMounted, onBeforeMount } from "vue";
import { io } from "socket.io-client";
import {
  GameState,
  GameRoom,
  GameSummary,
  IBall,
  IBar,
  IPoint,
} from "../../../../back/app/src/server/entities/server.entity";
import config from "../config/config";
import { title } from "process";
import PowerSliderComponent from "./PowerSliderComponent.vue";

if (config.socket.disconnected) {
  config.socket = io("http://" + window.location.hostname + ":3000", {
    auth: {
      token: localStorage.getItem("token"),
      user: JSON.parse(localStorage.getItem("user") || "{}"),
    },
  });
}
const socket = config.socket;
console.log(socket);
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
const slotImg = new Image();
slotImg.src = slotUrl;
const fillImg = new Image();
fillImg.src = fillUrl;
const fillRedImg = new Image();
fillRedImg.src = fillRedUrl;

const canvas = ref<HTMLCanvasElement | null>(null);

const startButton = ref(false);
const lobbyStatus = ref("Find match");
const hostScore = ref(0);
const clientScore = ref(0);
const hostName = ref("Host");
const clientName = ref("Client");
const color = ref("white");
const sumTitle = ref("");
const sumDate = ref("");
const sumTime = ref("");

// const stylesheet = document.styleSheets[0].cssRules[10].cssText;
// const vtitle = [...stylesheet.cssRules].find((r) => r.cssText === ".title");

let loadPercent = 120;
let kickOff = false;
let cSmashingPercent = 0;
let hSmashingPercent = 0;

let theRoom: GameRoom;
const gameSummary = reactive({
  hostElo: 0,
  hostName: "",
  hostPower: "",
  hostScore: 0,
  clientElo: 0,
  clientName: "",
  clientPower: "",
  clientScore: 0,
  eloChange: 0,
  gameMode: "",
  gameTime: 0,
  gameDate: new Date(),
});

function openModal() {
  document.querySelector(".modal")?.classList.remove("hidden");
  document.querySelector(".overlay")?.classList.remove("hidden");
}
function closeModal() {
  document.querySelector(".modal")?.classList.add("hidden");
  document.querySelector(".overlay")?.classList.add("hidden");
}

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

function openSummary() {
  document.querySelector(".sumModal")?.classList.remove("hidden");
  document.querySelector(".overlay")?.classList.remove("hidden");
}

function closeSummary() {
  document.querySelector(".sumModal")?.classList.add("hidden");
  document.querySelector(".overlay")?.classList.add("hidden");
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

function drawPlayground(ctx: CanvasRenderingContext2D) {
  // Draw the border + backgroung
  ctx.drawImage(plateauImg, 0, 0, 500, 500);
}

function drawScore(ctx: CanvasRenderingContext2D, gameState: GameState) {
  let slot = theRoom.options.scoreMax;

  for (let i = 0; i < slot; i++) {
    ctx.drawImage(slotImg, 125 + (287.5 / slot) * i, 300, 25, 25);
    if (i < gameState.score.host)
      ctx.drawImage(fillImg, 125 + (287.5 / slot) * i + 5, 300 + 5, 15, 15);
  }
  for (let i = 0; i < slot; i++) {
    ctx.drawImage(slotImg, 125 + (287.5 / slot) * i, 200 - 25, 25, 25);
    if (i < gameState.score.client)
      ctx.drawImage(fillRedImg, 125 + (287.5 / slot) * i + 5, 200 - 20, 15, 15);
  }
}

function updateSummary(summary: GameSummary) {
  gameSummary.hostElo = summary.hostElo;
  gameSummary.hostName = summary.hostName;
  gameSummary.hostPower = summary.hostPower;
  gameSummary.hostScore = summary.hostScore;
  gameSummary.clientElo = summary.clientElo;
  gameSummary.clientName = summary.clientName;
  gameSummary.clientPower = summary.clientPower;
  gameSummary.clientScore = summary.clientScore;
  gameSummary.eloChange = summary.eloChange;
  gameSummary.gameMode = summary.gameMode;
  gameSummary.gameTime = summary.gameTime;
  gameSummary.gameDate = summary.gameDate;
  setDateTime(gameSummary);
}

function setDateTime(summary: GameSummary) {
  let hours = Math.floor(summary.gameTime / 3600000);
  let minutes = Math.floor(
    summary.gameTime - summary.gameTime / 3600000 / 60000
  );
  let seconds = Math.floor(summary.gameTime - summary.gameTime / 60000);
  sumTime.value = hours + "H" + minutes + "M" + seconds + "S";
  sumDate.value = summary.gameDate.toString();
}

onMounted(() => {
  let ctx = canvas.value?.getContext("2d");
  socket.on("gameConfirmation", (gameRoom: GameRoom) => {
    theRoom = gameRoom;
    openModal();
  });

  socket.on("gameConfirmationTimeout", () => {
    closeModal();
    startButton.value = true;
    lobbyStatus.value = "Find Match";
  });

  socket.on("reconnect", (gameRoom: GameRoom) => {
    theRoom = gameRoom;
    hostName.value = theRoom.hostName;
    clientName.value = theRoom.clientName;
    lobbyStatus.value = "Play !";
    startButton.value = false;
  });

  socket.on("kickOff", () => {
    kickOff = true;
  });

  socket.on("play", () => {
    kickOff = false;
    loadPercent = 120;
  });

  socket.on("ServerUpdate", (gameState: GameState) => {
    if (theRoom) {
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
    }
  });

  socket.on(
    "Win",
    (gameRoom: GameRoom, elo_diff: number, summary: GameSummary) => {
      theRoom = gameRoom;
      lobbyStatus.value =
        "Victory ! You gained +" + elo_diff + " elo ! Return to lobby ?";
      startButton.value = false;
      updateSummary(summary);
      color.value = "green";
      sumTitle.value = "Victory";
      document.getElementById("title")!.style.color = "green";
      document.getElementById("summary")!.style.borderColor = "green";
      openSummary();
    }
  );

  socket.on(
    "Lose",
    (gameRoom: GameRoom, elo_diff: number, summary: GameSummary) => {
      theRoom = gameRoom;
      lobbyStatus.value =
        "Defeat... You lost -" + elo_diff + " elo ! Return to lobby ?";
      startButton.value = false;
      updateSummary(summary);
      color.value = "red";
      sumTitle.value = "Defeat";
      document.getElementById("title")!.style.color = "red";
      document.getElementById("summary")!.style.borderColor = "red";
      openSummary();
    }
  );

  socket.on("startGame", (gameRoom: GameRoom) => {
    theRoom = gameRoom;
    hostName.value = theRoom.hostName;
    clientName.value = theRoom.clientName;
    lobbyStatus.value = "Play !";
  });

  window.addEventListener("keydown", (e) => {
    if (theRoom && theRoom.status === "playing") {
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
    if (e.key === "o") socket.emit("debugging");
  });

  window.addEventListener("keyup", (e) => {
    if (theRoom && theRoom.status === "playing") {
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

<style>
.hidden {
  display: none;
}
.modal {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 70%;
  background-color: white;
  padding: 6rem;
  border-radius: 5px;
  box-shadow: 0 3rem 5rem rgba(0, 0, 0, 0.3);
  z-index: 10;
}
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(3px);
  z-index: 5;
}
</style>
