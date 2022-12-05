<template>
  <section class="lobby container">
    <div class="principalSection">
      <div class="mainContainer" :class="!displayLoading ? '' : ' hidden'">
        <div>
          <power-slider-component v-model="power" id="powerSlider" />
          <div v-if="!toggleLadder">
            <div>
              <h1>Custom Game with {{ friendName }}</h1>
              <div v-if="!toggleInvited" class="inviter">
                <div>
                  <div class="setting">
                    <label for="score">Max Score</label>
                    <input v-model="score" type="range" id="score" name="score" min="1" max="100" :disabled="readyButton == true" />
                    <h4>{{ score }}</h4>
                  </div>
                  <div class="setting">
                    <label for="ballSpeed">Ball Speed</label>
                    <input v-model="ballSpeed" type="range" id="ballSpeed" name="ballSpeed" min="0" max="5" :disabled="readyButton == true" />
                    <h4>{{ ballSpeed }}</h4>
                  </div>
                  <div class="setting">
                    <label for="ballSize">Ball Size</label>
                    <input v-model="ballSize" type="range" id="ballSize" name="ballSize" min="0" max="3" :disabled="readyButton == true" />
                    <h4>{{ ballSize }}</h4>
                  </div>
                  <div class="setting">
                    <label for="barSpeed">Bar Speed</label>
                    <input v-model="barSpeed" type="range" id="barSpeed" name="barSpeed" min="0" max="5" :disabled="readyButton == true" />
                    <h4>{{ barSpeed }}</h4>
                  </div>
                  <div class="setting">
                    <label for="barSize">Bar Size Factor</label>
                    <input v-model="barSize" type="range" id="barSize" name="barSize" min="0" max="2" :disabled="readyButton == true" />
                    <h4>{{ barSize }}</h4>
                  </div>
                  <div class="setting">
                    <label for="smashStrength">Smash Strength</label>
                    <input
                      v-model="smashStrength"
                      type="range"
                      id="smashStrength"
                      name="smashStrength"
                      min="1"
                      max="10"
                      :disabled="smashes == false || readyButton == true"
                    />
                    <h4>{{ smashStrength }}</h4>
                  </div>
                  <div class="setting">
                    <div class="checkbox">
                      <input v-model="effects" type="checkbox" id="switch" :disabled="readyButton == true" /><label for="effects">Effects</label>
                    </div>
                    <div class="checkbox">
                      <input v-model="powers" type="checkbox" id="switch" :disabled="readyButton == true" /><label for="powers">Powers</label>
                    </div>
                    <div class="checkbox">
                      <input v-model="smashes" type="checkbox" id="switch" :disabled="readyButton == true" /><label for="smashes">Smashes</label>
                    </div>
                  </div>
                </div>
              </div>
              <button class="button" @click="readyUp()" :disabled="readyButton">
                {{ customReady }}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div :class="!displayLoading ? '' : ' hidden'" class="svgSection">
        <img src="../assets/playGame.gif" alt="" class="playButton" @click="findMatch()" />
      </div>
      <div :class="displayLoading ? '' : ' hidden'" class="loadingDiv">
        <img src="../assets/loadingGameIllustration.gif" alt="" class="loadingImage" />
      </div>
    </div>

    <div v-if="toggleLadder" class="ladder">
      <canvas class="canvas hidden" ref="canvas"></canvas>
      <div v-if="summary" class="overlay">
        <Modal :title="sumTitle" :data="gameSummary" :start="start" :end="end" @close="showSummary(false)"></Modal>
      </div>
      <div v-if="noFriends" class="overlay">
        <Denial :inviter="friendName" @sadStory="showDenial(false)"></Denial>
      </div>
      <!-- <div class="power">Selected power: {{ power }}</div>
      <div class="power">Selected power: {{ power }}</div> -->
    </div>
    <div v-else class="custom"></div>
    <svg preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" :class="!displayLoading ? 'bottomSvg' : ' hidden'">
      <path
        fill="#C1A36B"
        fill-opacity="1"
        d="M0,128L80,122.7C160,117,320,107,480,122.7C640,139,800,181,960,197.3C1120,213,1280,203,1360,197.3L1440,192L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"
      ></path>
    </svg>
  </section>
</template>

<script setup lang="ts">
import { useStore } from "@/store";
import { GameSummaryData } from "@/types/GameSummary";
import { Socket } from "engine.io-client";
import { onMounted, onUnmounted, reactive, ref } from "vue";
import { GameOptions, GameRoom, GameState, IBar } from "../../../../back/app/src/server/entities/server.entity";
import { User } from "@/types/User";
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
import Denial from "./InviteDenied/Modal.vue";
import PowerSliderComponent from "./PowerSliderComponent.vue";
import Modal from "./Summary/Modal.vue";
//import { SCOPABLE_TYPES } from "@babel/types";

const store = useStore();
let socket = store.socket;

store.$subscribe((mutation, state) => {
  socket = state.socket;
});

console.log("config " + socket?.id);
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
// const sumDate = ref("");
// const sumTime = ref(0);

const noFriends = ref(false);
const summary = ref(false);
const toggleLadder = ref(true);
const toggleInvited = ref(false);
const gameBoard = ref(false);
let displayLoading = ref(false);

const friendName = ref("Placeholder");
const customReady = ref("Ready ?");
const readyButton = ref(false);
const score = ref(5);
const ballSpeed = ref(1);
const ballSize = ref(1);
const barSpeed = ref(1);
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

let start: Date;
let end: Date;

let theRoom: GameRoom;
const gameSummary = reactive<GameSummaryData>({
  host: {
    elo: 1500,
    name: "Host",
    power: "",
    score: 0,
    eloChange: 0,
  },
  client: {
    elo: 1000,
    name: "Client",
    power: "",
    score: 0,
    eloChange: 0,
  },
  gameMode: "",
});

// function Confirmation(show: boolean) {
//   confirmation.value = show;
// }

function showSummary(show: boolean) {
  summary.value = show;
}

function showDenial(show: boolean) {
  noFriends.value = show;
}

function findMatch() {
  displayLoading.value = true;
  startButton.value = true;
  lobbyStatus.value = "Looking for an opponent...";
  powers.value = false;
  socket?.emit("joinQueue", {
    power: power.value,
  });
}
function readyUp() {
  displayLoading.value = true;
  readyButton.value = true;
  customReady.value = "Waiting for " + friendName.value;
  if (toggleInvited.value) {
    socket?.emit("readyInvitee", {
      power: power.value,
    });
  } else {
    updateOpts();
    socket?.emit("readyInviter", {
      gameOpts,
      power: power.value,
    });
  }
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

function toggleInvitedMode() {
  toggleInvited.value = toggleInvited.value ? false : true;
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
  // Draw the border + backgroung
  ctx.drawImage(plateauImg, 0, 0, cWidth, cHeight);
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

function updateSummary(summary: GameSummaryData) {
  gameSummary.host = summary.host;
  gameSummary.client = summary.client;
  gameSummary.gameMode = summary.gameMode;
}

let gState: GameState;
function test(ctx: CanvasRenderingContext2D | null | undefined, gameState: GameState) {
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
      ctx.drawImage(ballImg, ball.pos.x - ball.size * scale, ball.pos.y - ball.size * scale, ball.size * 2 * scale, ball.size * 2 * scale);
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
  ctx = canvas.value?.getContext("2d");
  console.log("ctx " + ctx);
  ctx?.drawImage(plateauImg, 0, 0, cWidth, cHeight);

  scaling(ctx);

  registerSockets(store.socket as any);
  store.$subscribe((mutation, state) => {
    //   socket.on("gameConfirmation", (gameRoom: GameRoom) => {
    //     theRoom = gameRoom;
    //     showModal(true);
    //   });

    //   socket.on("gameConfirmationTimeout", () => {
    //     showModal(false);
    //     startButton.value = true;
    //     lobbyStatus.value = "Find Match";
    //   });

    if (state.socket) {
      registerSockets(state.socket as any);
    }
  });

  //needs to be moved
  //window.removeEventListener("resize", resizeCanvas);
  window.addEventListener("resize", resizeCanvas);
});

onUnmounted(() => {
  unregisterSockets(store.socket as any);
});

const registerSockets = (state: Socket) => {
  !socket?.hasListeners("customInviter") && socket?.on("customInviter", customInviter);
  !socket?.hasListeners("customInvitee") && socket?.on("customInvitee", customInvitee);
  !socket?.hasListeners("foreverAlone") && socket?.on("foreverAlone", foreverAlone);
  !socket?.hasListeners("spectating") && socket?.on("spectating", spectating);
  !socket?.hasListeners("reconnect") && socket?.on("reconnect", reconnect);
  !socket?.hasListeners("kickOff") && socket?.on("kickOff", kickOfff);
  !socket?.hasListeners("play") && socket?.on("play", play);
  !socket?.hasListeners("ServerUpdate") && socket?.on("ServerUpdate", ServerUpdate);
  !socket?.hasListeners("Win") && socket?.on("Win", Win);
  !socket?.hasListeners("Lose") && socket?.on("Lose", Lose);
  !socket?.hasListeners("startGame") && socket?.on("startGame", startGame);
  !socket?.hasListeners("customInvitation") && socket?.on("customInvitation", customInvitation);
};

const unregisterSockets = (state: Socket) => {
  socket?.removeListener("customInviter");
  socket?.removeListener("customInvitee");
  socket?.removeListener("foreverAlone");
  socket?.removeListener("spectating");
  socket?.removeListener("reconnect");
  socket?.removeListener("kickOff");
  socket?.removeListener("play");
  socket?.removeListener("ServerUpdate");
  socket?.removeListener("Win");
  socket?.removeListener("Lose");
  socket?.removeListener("startGame");
  socket?.removeListener("customInvitation");
};

const customInviter = (friend: string) => {
  friendName.value = friend;
  toggleGameQueue();
};

const customInvitee = (friend: string) => {
  friendName.value = friend;
  toggleInvitedMode();
  toggleGameQueue();
};

const foreverAlone = () => {
  toggleGameQueue();
  noFriends.value = true;
};

const spectating = (gameRoom: GameRoom) => {
  console.log("watching game");
  theRoom = gameRoom;
  hostName.value = theRoom.hostName;
  clientName.value = theRoom.clientName;
  lobbyStatus.value = "Spectating";
  startButton.value = false;
  powers.value = false;
  //   gameBoard.value = true;
  document.querySelector(".canvas")?.classList.remove("hidden");
};

const reconnect = (gameRoom: GameRoom) => {
  console.log("reconnecting");
  theRoom = gameRoom;
  hostName.value = theRoom.hostName;
  clientName.value = theRoom.clientName;
  lobbyStatus.value = "Play !";
  startButton.value = false;
  powers.value = false;
  //   gameBoard.value = true;
  document.querySelector(".canvas")?.classList.remove("hidden");
  //   return "done";
};

const kickOfff = () => {
  kickOff = true;
};

const play = () => {
  kickOff = false;
  loadPercent = 120;
};

const ServerUpdate = (gameState: GameState) => {
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
      ctx.drawImage(ballImg, ball.pos.x - ball.size * scale, ball.pos.y - ball.size * scale, ball.size * 2 * scale, ball.size * 2 * scale);
      ctx.fillStyle = "black";
      drawSmashingEffect(gameState.clientBar, cSmashingPercent, ctx);
      drawSmashingEffect(gameState.hostBar, hSmashingPercent, ctx);
    }
  }
};

const Win = (gameRoom: GameRoom, elo_diff: number, summary: GameSummaryData) => {
  theRoom = gameRoom;
  lobbyStatus.value = "Defeat... You lost -" + elo_diff + " elo ! Return to lobby ?";
  startButton.value = false;
  readyButton.value = false;
  displayLoading.value = false;
  customReady.value = "Ready ?";
  powers.value = true;
  end = new Date();
  updateSummary(summary);
  color.value = "red";
  sumTitle.value = "Defeat";
  showSummary(true);
  //   gameBoard.value = false;
  document.querySelector(".canvas")?.classList.add("hidden");
};

const Lose = (gameRoom: GameRoom, elo_diff: number, summary: GameSummaryData) => {
  theRoom = gameRoom;
  lobbyStatus.value = "Victory ! You gained +" + elo_diff + " elo ! Return to lobby ?";
  startButton.value = false;
  readyButton.value = false;
  displayLoading.value = false;
  customReady.value = "Ready ?";
  powers.value = true;
  end = new Date();
  updateSummary(summary);
  color.value = "green";
  sumTitle.value = "Victory";
  showSummary(true);
  //   gameBoard.value = false;
  document.querySelector(".canvas")?.classList.add("hidden");
};

const startGame = (gameRoom: GameRoom) => {
  lobbyStatus.value = "Play !";
  if (!toggleLadder.value) toggleLadder.value = true;
  if (toggleInvited.value) toggleInvited.value = false;
  powers.value = false;
  theRoom = gameRoom;
  hostName.value = theRoom.hostName;
  clientName.value = theRoom.clientName;
  start = new Date();
  //   gameBoard.value = true;
  console.log(gameBoard.value);
  console.log(canvas.value);
  document.querySelector(".canvas")?.classList.remove("hidden");
};

const customInvitation = () => {};
</script>

<style lang="scss" scoped>
@import "../styles/containerStyle";
@import "../styles/svgStyles";
@import "../styles/variables";

.mainContainer {
  justify-content: space-around;
  .inviter {
    display: flex;
    flex-direction: column;
    width: 100%;
    .setting {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-around;
      label {
        width: 30%;
        text-align: left;
      }
      h4 {
        width: 15%;
      }
      input[type="range"] {
        overflow: hidden;
        -webkit-appearance: none;
        border-radius: 10px;
        background-color: $secondary;
      }
      input[type="range"]::-webkit-slider-runnable-track {
        -webkit-appearance: none;
        color: $primary;
      }
      input[type="range"]::-webkit-slider-thumb {
        width: 20px;
        -webkit-appearance: none;
        height: 20px;
        cursor: pointer;
        background: #524e9b;
        border-radius: 100%;
        box-shadow: -80px 0 0 70px $primary;
      }
      input[type="range"]:disabled {
        opacity: 0.6;
      }
      .checkbox {
        display: flex;
        margin-top: 10px;
        flex-direction: row;
        align-items: center;
        input[type="checkbox"] {
          width: 20px;
          height: 20px;
          accent-color: #524e9b;
        }
      }
    }
  }
  .button {
    margin: 25px 0 25px 0;
  }
}
.playButton {
  &:hover {
    cursor: pointer;
  }
}
.svgSection {
  width: 30%;
  img {
    width: 100%;
  }
  .playButton {
    opacity: 0.8;
    &:hover {
      opacity: 1;
    }
  }
}
.loadingDiv {
  width: 100vw;
  height: 90vh;
  display: flex;
  justify-content: center;
  align-items: center;
  .loadingImage {
    width: 400px;
    height: 400px;
  }
}
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
