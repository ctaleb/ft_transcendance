<template>
  <div>
    <button @click="toggleGameQueue()">CHANGE MODE</button>
  </div>
  <div :class="'ladder' + (toggleLadder ? '' : ' hidden')">
    <!-- <PowerSliderComponent v-model="power" id="powerSlider" /> -->
    <div>
      <button @click="findMatch()" :disabled="startButton">
        {{ lobbyStatus }}
      </button>
    </div>
    <div>
      <canvas class="canvas hidden" ref="canvas"></canvas>
    </div>

    <div v-if="summary" class="overlay">
      <!-- <div v-if="modal" class="modal">
        <h1>Ready to play ?</h1>
        <button @click="confirmGame()">Yes</button>
        <button @click="denyGame()">No</button>
      </div> -->
      <Modal
        :title="sumTitle"
        :data="gameSummary"
        @close="showSummary(false)"
      ></Modal>
    </div>
    <div class="power">Selected power: {{ power }}</div>
  </div>
  <div :class="'custom' + (toggleLadder ? ' hidden' : '')">
    <div>
      <div>
        <label for="score">Max Score: {{ score }}</label>
        <div>
          1<input
            v-model="score"
            type="range"
            id="score"
            name="score"
            min="1"
            max="100"
          />100
        </div>
      </div>
      <div>
        <label for="ballSpeed">Initial Ball Speed: {{ ballSpeed }}</label>
        <div>
          1<input
            v-model="ballSpeed"
            type="range"
            id="ballSpeed"
            name="ballSpeed"
            min="1"
            max="5"
          />5
        </div>
      </div>
      <div>
        <label for="ballSize"
          >Ball Size Factor (0 for half size): {{ ballSize }}</label
        >
        <div>
          0<input
            v-model="ballSize"
            type="range"
            id="ballSize"
            name="ballSize"
            min="0"
            max="10"
          />10
        </div>
      </div>
      <div>
        <label for="barSpeed"
          >Bar Speed Factor (0 for half speed): {{ barSpeed }}</label
        >
        <div>
          0<input
            v-model="barSpeed"
            type="range"
            id="barSpeed"
            name="barSpeed"
            min="0"
            max="10"
          />10
        </div>
      </div>
      <div>
        <label for="barSize"
          >Bar Size Factor (0 for half size): {{ barSize }}</label
        >
        <div>
          0<input
            v-model="barSize"
            type="range"
            id="barSize"
            name="barSize"
            min="0"
            max="10"
          />10
        </div>
      </div>
      <div>
        <input v-model="smashes" type="checkbox" id="switch" /><label
          for="smashes"
          >Toggle smashes</label
        >
      </div>
      <div>
        <label for="smashStrength"
          >Smash Strength Factor: {{ smashStrength }}</label
        >
        <div>
          1<input
            v-model="smashStrength"
            type="range"
            id="smashStrength"
            name="smashStrength"
            min="1"
            max="10"
            :disabled="smashes == false"
          />10
        </div>
      </div>
      <div>
        <input v-model="effects" type="checkbox" id="switch" /><label
          for="effects"
          >Toggle effects</label
        >
      </div>
      <div>
        <input v-model="powers" type="checkbox" id="switch" /><label
          for="powers"
          >Toggle powers</label
        >
      </div>
      <div>
        <label for="invitee">User to Invite: </label>
        <input v-model="invitee" placeholder="User Name" />
      </div>
      <div>
        <button @click="sendInvite()" :disabled="startButton">
          Send Invite
        </button>
      </div>
    </div>
  </div>
  <div :class="'powerSlider' + (powers ? '' : ' hidden')">
    <PowerSliderComponent v-model="power" id="powerSlider" />
  </div>
</template>

<style lang="scss">
@import "../style/summary.scss";
</style>

<script setup lang="ts">
import ballUrl from "../assets/ball.png";
import paddleUrl from "../assets/paddle_grec.png";
import powerChargeUrl from "../assets/powerCharge.png";
import energyUrl from "../assets/energy.png";
import paddleEnergyUrl from "../assets/energy_paddle_grec.png";
import plateauUrl from "../assets/plateauV2.png";
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
  IBall,
  IBar,
  IPoint,
  GameOptions,
} from "../../../../back/app/src/server/entities/server.entity";
import config from "../config/config";
import { title } from "process";
import PowerSliderComponent from "./PowerSliderComponent.vue";
import Summary from "./Summary.vue";
import { GameSummaryData } from "@/types/GameSummary";
import Modal from "./Summary/Modal.vue";

const socket = config.socket;
console.log("config " + socket.id);
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

const startButton = ref(false);
const lobbyStatus = ref("Find match");
const hostScore = ref(0);
const clientScore = ref(0);
const hostName = ref("Host");
const clientName = ref("Client");
const color = ref("white");
const sumTitle = ref("Placeholder");
const sumDate = ref("");
const sumTime = ref(0);
// const modal = ref(false);
const summary = ref(false);
const toggleLadder = ref(true);

const invitee = ref("");
const score = ref(5);
const ballSpeed = ref(3);
const ballSize = ref(1);
const barSpeed = ref(7);
const barSize = ref(1);
const smashStrength = ref(1);
const spinStrength = ref(1);
const effects = ref(true);
const powers = ref(true);
const smashes = ref(true);

let gameOpts: GameOptions;

const power = ref("");

let loadPercent = 120;
let kickOff = false;
let cSmashingPercent = 0;
let hSmashingPercent = 0;

let theRoom: GameRoom;
const gameSummary = reactive<GameSummaryData>({
  host: {
    elo: 1500,
    name: "Host",
    power: "",
    score: 0,
    eloChange: 25,
  },
  client: {
    elo: 42,
    name: "Client",
    power: "",
    score: 0,
    eloChange: -12,
  },
  gamemode: "",
  start: new Date(),
  end: new Date(),
});

// function Confirmation(show: boolean) {
//   confirmation.value = show;
// }

function showSummary(show: boolean) {
  summary.value = show;
}

function findMatch() {
  startButton.value = true;
  lobbyStatus.value = "Looking for an opponent...";
  powers.value = false;
  socket.emit("joinQueue", {
    power: power.value,
  });
}
function sendInvite() {
  startButton.value = false;
  lobbyStatus.value = "Sending invite...";
  updateOpts();
  socket.emit("customInvite", {
    gameOpts,
    power: power.value,
    invitee: invitee.value,
  });
}

function updateOpts() {
  gameOpts = {
    scoreMax: score.value,
    ballSpeed: ballSpeed.value,
    ballSize: ballSize.value,
    barSpeed: barSpeed.value,
    barSize: barSize.value,
    smashStrength: smashStrength.value,
    effects: effects.value,
    powers: powers.value,
    smashes: smashes.value,
  };
}

function toggleGameQueue() {
  toggleLadder.value = toggleLadder.value ? false : true;
}

// function confirmGame() {
//   socket.emit("playerReady", {}, () => {});
//   document.getElementById("powerSlider")?.classList.add("hidden");
//   showModal(false);
// }

// function denyGame() {
//   socket.emit("playerNotReady", {}, () => {});
//   showModal(false);
// }

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

function drawSmashingEffect(
  bar: IBar,
  smashingPercent: number,
  ctx: CanvasRenderingContext2D
) {
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
  // Draw the border + backgroung
  ctx.drawImage(plateauImg, 0, 0, cWidth, cHeight);
}

function drawScore(ctx: CanvasRenderingContext2D, gameState: GameState) {
  let slot = theRoom.options.scoreMax;

  for (let i = 0; i < slot; i++) {
    ctx.drawImage(
      slotImg,
      cWidth * 0.25 + ((cWidth * 0.5) / (slot + 1)) * (i + 1) - 10 * scale,
      cHeight * 0.148 - 25 * scale,
      20 * scale,
      20 * scale
    );
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
    ctx.drawImage(
      slotImg,
      cWidth * 0.25 + ((cWidth * 0.5) / (slot + 1)) * (i + 1) - 10 * scale,
      cHeight * 0.894 - 25 * scale,
      20 * scale,
      20 * scale
    );
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

function updateSummary(summary: GameSummary) {
  // gameSummary.hostElo = summary.hostElo;
  // gameSummary.hostName = summary.hostName;
  // gameSummary.hostPower = summary.hostPower;
  // gameSummary.hostScore = summary.hostScore;
  // gameSummary.clientElo = summary.clientElo;
  // gameSummary.clientName = summary.clientName;
  // gameSummary.clientPower = summary.clientPower;
  // gameSummary.clientScore = summary.clientScore;
  // gameSummary.eloChange = summary.eloChange;
  // gameSummary.gameMode = summary.gameMode;
  // gameSummary.gameTime = summary.gameTime;
  // gameSummary.gameDate = summary.gameDate;
  // setDateTime(gameSummary);
}

function setDateTime(summary: GameSummary) {
  sumTime.value = new Date().getDate() - new Date(summary.gameDate).getDate();
  sumDate.value = summary.gameDate.toString();
}

let gState: GameState;
function test(
  ctx: CanvasRenderingContext2D | null | undefined,
  gameState: GameState
) {
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
      ctx.drawImage(
        ballImg,
        ball.pos.x - ball.size * scale,
        ball.pos.y - ball.size * scale,
        ball.size * 2 * scale,
        ball.size * 2 * scale
      );
      ctx.fillStyle = "black";
      drawSmashingEffect(gameState.clientBar, cSmashingPercent, ctx);
      drawSmashingEffect(gameState.hostBar, hSmashingPercent, ctx);
    }
  }
}

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
}

function resizeCanvas() {
  scaling(ctx);
  test(ctx, gState);
}

onMounted(() => {
  let ctx = canvas.value?.getContext("2d");
  scaling(ctx);
  //   socket.on("gameConfirmation", (gameRoom: GameRoom) => {
  //     theRoom = gameRoom;
  //     showModal(true);
  //   });

  //   socket.on("gameConfirmationTimeout", () => {
  //     showModal(false);
  //     startButton.value = true;
  //     lobbyStatus.value = "Find Match";
  //   });

  socket.on("reconnect", (gameRoom: GameRoom) => {
    console.log("reconnecting");
    theRoom = gameRoom;
    hostName.value = theRoom.hostName;
    clientName.value = theRoom.clientName;
    lobbyStatus.value = "Play !";
    startButton.value = false;
    powers.value = false;
    document.querySelector(".canvas")?.classList.remove("hidden");
  });

  socket.on("kickOff", () => {
    kickOff = true;
  });

  socket.on("play", () => {
    kickOff = false;
    loadPercent = 120;
  });

  socket.on("ServerUpdate", (gameState: GameState) => {
    gState = gameState;
    scalePosition(gameState);
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
        drawPowerCharge(ctx, gameState);
        kickoffLoading(ctx);
        ctx.drawImage(
          ballImg,
          ball.pos.x - ball.size * scale,
          ball.pos.y - ball.size * scale,
          ball.size * 2 * scale,
          ball.size * 2 * scale
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
      document.querySelector(".canvas")?.classList.add("hidden");
      showSummary(true);
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
      document.querySelector(".canvas")?.classList.add("hidden");
      showSummary(true);
    }
  );

  socket.on("startGame", (gameRoom: GameRoom) => {
    powers.value = false;
    theRoom = gameRoom;
    hostName.value = theRoom.hostName;
    clientName.value = theRoom.clientName;
    lobbyStatus.value = "Play !";
    document.querySelector(".canvas")?.classList.remove("hidden");
  });

  //todo / tochange
  socket.on("customInvitation", () => {});

  //needs to be moved
  //window.removeEventListener("resize", resizeCanvas);
  window.addEventListener("resize", resizeCanvas);
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
.power {
  position: absolute;
  bottom: 0;
}
</style>
