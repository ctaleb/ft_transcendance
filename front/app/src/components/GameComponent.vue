<template>
  <section class="lobby container">
    <div v-if="noFriends" class="overlay">
      <Denial :inviter="friendName" @sadStory="showDenial(false)"></Denial>
    </div>
    <div v-if="summary" class="overlay">
      <Modal :title="sumTitle" :data="gameSummary" :opponent="opponentImg" :start="start" :end="end" @close="showSummary(false)"></Modal>
      <!-- <Modal :title="sumTitle" :data="gameSummary" :opponent="opponentImg.src" :start="start" :end="end" @close="showSummary(false)"></Modal> -->
    </div>
    <div class="principalSection">
      <div v-if="lobbyStatus == 'settingsInviter' || lobbyStatus == 'settingsInvitee' || lobbyStatus == 'lobby'" class="mainContainer">
        <div>
          <power-slider-component v-model="power" id="powerSlider" />
          <div v-if="lobbyStatus == 'settingsInviter' || lobbyStatus == 'settingsInvitee'">
            <div>
              <h1>Custom Game with {{ friendName }}</h1>
              <div v-if="lobbyStatus == 'settingsInviter'" class="inviter">
                <div>
                  <div class="setting">
                    <label for="score">Max Score</label>
                    <input v-model="scoreMax" type="range" id="score" name="score" min="1" max="100" :disabled="readyButton == true" />
                    <h4>{{ scoreMax }}</h4>
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
      <div v-if="lobbyStatus == 'lobby'" class="svgSection">
        <img src="../assets/playGame.gif" alt="" class="playButton" @click="findMatch()" />
      </div>
      <div v-if="lobbyStatus == 'queuing'" class="loadingDiv">
        <img src="../assets/loadingGameIllustration.gif" alt="" class="loadingImage" />
      </div>
    </div>
    <div v-if="lobbyStatus == 'playing' || lobbyStatus == 'spectating'" class="ladder">
      <GameCanvasComponent :opponent="store.user!" :us="store.user!" :gameOptions="gameOpts"></GameCanvasComponent>
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
import GameCanvasComponent from "@/components/GameCanvasComponent.vue";
import { fetchJSONDatas } from "@/functions/funcs";
import { socketLocal, useStore } from "@/store";
import { GameOptions, GameRoom } from "@/types/Game";
import { GameSummaryData } from "@/types/GameSummary";
import { getUserByNickname, User } from "@/types/User";
import { onMounted, onUnmounted, reactive, ref, watch } from "vue";
import Denial from "./InviteDenied/Modal.vue";
import PowerSliderComponent from "./PowerSliderComponent.vue";
import Modal from "./Summary/Modal.vue";

const store = useStore();

const startButton = ref(false);
// const lobbyStatus = ref("Find match");

const scoreMax = ref(5);
const ballSpeed = ref(1);
const ballSize = ref(1);
const barSpeed = ref(1);
const barSize = ref(1);
const smashStrength = ref(1);
const effects = ref(true);
const powers = ref(true);
const smashes = ref(true);

const lobbyStatus = ref("lobby");

const hostScore = ref(0);
const clientScore = ref(0);
const hostName = ref("Host");
const clientName = ref("Client");
const color = ref("white");
const sumTitle = ref("Placeholder");

const noFriends = ref(false);
const summary = ref(false);
const toggleLadder = ref(true);
const toggleInvited = ref(false);
const displayLoading = ref(false);

const friendName = ref("Placeholder");
const customReady = ref("Ready ?");
const readyButton = ref(false);

let gameOpts: GameOptions;

const power = ref("");

const opponentImg = ref("");
const start = ref(new Date());
const end = ref(new Date());

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
  winnerID: 0,
});

function showSummary(show: boolean) {
  summary.value = show;
}
function showDenial(show: boolean) {
  noFriends.value = show;
}
function findMatch() {
  displayLoading.value = true;
  startButton.value = true;
  lobbyStatus.value = "queuing";
  powers.value = false;
  socketLocal?.value?.emit("joinQueue", {
    power: power.value,
  });
}
function readyUp() {
  displayLoading.value = true;
  readyButton.value = true;
  customReady.value = "Waiting for " + friendName.value;
  if (lobbyStatus.value === "settingsInvitee") {
    socketLocal?.value?.emit("readyInvitee", {
      power: power.value,
    });
  } else {
    updateOpts();
    socketLocal?.value?.emit("readyInviter", {
      gameOpts,
      power: power.value,
    });
  }
}
function updateOpts() {
  gameOpts = {
    scoreMax: scoreMax.value,
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

function updateSummary(summary: GameSummaryData) {
  gameSummary.host = summary.host;
  gameSummary.client = summary.client;
  gameSummary.gameMode = summary.gameMode;
}

// store.$subscribe((mutation, state) => {
//   if (store.user?.status != "inQueue") lobbyStatus.value = "lobby";
//   else lobbyStatus.value = "queuing";
// });

onMounted(() => {
  if (store.user?.status == "inQueue") lobbyStatus.value = "queuing";
  // ctx = canvas.value?.getContext("2d");
  // ctx?.drawImage(plateauImg, 0, 0, cWidth, cHeight);
  // scaling(ctx);
  registerSockets(socketLocal);

  watch(
    () => socketLocal.value,
    () => {
      registerSockets(socketLocal);
    }
  );
  // window.addEventListener("resize", resizeCanvas);
});

onUnmounted(() => {
  unregisterSockets(socketLocal);
});

const registerSockets = (socket: any) => {
  !socket?.value?.hasListeners("customInviter") && socket?.value?.on("customInviter", customInviter);
  !socket?.value?.hasListeners("customInvitee") && socket?.value?.on("customInvitee", customInvitee);
  !socket?.value?.hasListeners("foreverAlone") && socket?.value?.on("foreverAlone", foreverAlone);
  !socket?.value?.hasListeners("spectating") && socket?.value?.on("spectating", spectating);
  !socket?.value?.hasListeners("reconnect") && socket?.value?.on("reconnect", reconnect);
  !socket?.value?.hasListeners("Win") && socket?.value?.on("Win", Win);
  !socket?.value?.hasListeners("Lose") && socket?.value?.on("Lose", Lose);
  !socket?.value?.hasListeners("endGame") && socket?.value?.on("endGame", endGame);
  !socket?.value?.hasListeners("startGame") && socket?.value?.on("startGame", startGame);
  !socket?.value?.hasListeners("customInvitation") && socket?.value?.on("customInvitation", customInvitation);
};

const unregisterSockets = (socket: any) => {
  socket?.value?.removeListener("customInviter");
  socket?.value?.removeListener("customInvitee");
  socket?.value?.removeListener("foreverAlone");
  socket?.value?.removeListener("spectating");
  socket?.value?.removeListener("reconnect");
  socket?.value?.removeListener("Win");
  socket?.value?.removeListener("Lose");
  socket?.value?.removeListener("endGame");
  socket?.value?.removeListener("startGame");
  socket?.value?.removeListener("customInvitation");
};

const customInviter = (friend: string) => {
  friendName.value = friend;
  lobbyStatus.value = "settingsInviter";
};

const customInvitee = (friend: string) => {
  friendName.value = friend;
  lobbyStatus.value = "settingsInvitee";
  // toggleInvitedMode();
  // toggleGameQueue();
};

const foreverAlone = () => {
  // toggleGameQueue();
  lobbyStatus.value = "lobby";
  noFriends.value = true;
};

const spectating = (gameRoom: GameRoom) => {
  // console.log("watching game");
  theRoom = gameRoom;
  hostName.value = theRoom.hostName;
  clientName.value = theRoom.clientName;
  lobbyStatus.value = "spectating";
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

const Win = (gameRoom: GameRoom, elo_diff: number, summary: GameSummaryData) => {
  theRoom = gameRoom;
  lobbyStatus.value = "lobby";
  startButton.value = false;
  readyButton.value = false;
  displayLoading.value = false;
  customReady.value = "Ready ?";
  powers.value = true;
  end.value = new Date();
  updateSummary(summary);
  color.value = "green";
  sumTitle.value = "Victory";
  showSummary(true);
  //   gameBoard.value = false;
  document.querySelector(".canvas")?.classList.add("hidden");
};

const Lose = (gameRoom: GameRoom, elo_diff: number, summary: GameSummaryData) => {
  theRoom = gameRoom;
  lobbyStatus.value = "lobby";
  startButton.value = false;
  readyButton.value = false;
  displayLoading.value = false;
  customReady.value = "Ready ?";
  powers.value = true;
  end.value = new Date();
  updateSummary(summary);
  color.value = "red";
  sumTitle.value = "Defeat";
  showSummary(true);
  //   gameBoard.value = false;
  document.querySelector(".canvas")?.classList.add("hidden");
};

const endGame = (gameRoom: GameRoom, elo_diff: number, summary: GameSummaryData, winner: string) => {
  theRoom = gameRoom;
  lobbyStatus.value = "lobby";
  startButton.value = false;
  readyButton.value = false;
  displayLoading.value = false;
  customReady.value = "Ready ?";
  end.value = new Date();
  updateSummary(summary);
  color.value = "gold";
  sumTitle.value = winner + " has won!";
  showSummary(true);
};

const startGame = (gameRoom: GameRoom) => {
  lobbyStatus.value = "playing";
  // if (!toggleLadder.value) toggleLadder.value = true;
  // if (toggleInvited.value) toggleInvited.value = false;
  // powers.value = false;
  theRoom = gameRoom;
  hostName.value = theRoom.hostName;
  clientName.value = theRoom.clientName;
  opponentImg.value = User.getAvatar(gameRoom.opponent);
  start.value = new Date();
  document.querySelector(".canvas")?.classList.remove("hidden");
};

const customInvitation = () => {};
</script>

<style lang="scss" scoped>
@import "../styles/containerStyle";
@import "../styles/svgStyles";
@import "../styles/variables";

.canvas {
  z-index: 10;
}

.canvas {
  z-index: 10;
}

.principalSection {
  flex-wrap: wrap;
  .mainContainer {
    justify-content: space-around;
    z-index: 1;
    width: 40%;
    overflow-y: hidden;
    overflow-x: hidden;
    padding: 25px;
    //height: 50% !important;
    margin-top: 0;
    @include screen-xl {
      width: 50%;
      //  height: 50% !important;
      margin-top: 0;
    }
    @include screen-lg {
      width: 100%;
      //  height: 30% !important;
    }
    @include screen-md {
      width: 100%;
      //  height: 40% !important;
    }
    .powerSliderDiv {
      height: 100%;
      width: 100%;
    }
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
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 30%;
    @include screen-lg {
      width: 70%;
    }
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
    z-index: -1;
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
    padding: 3rem;
    border-radius: 5px;
    box-shadow: 0 3rem 5rem rgba(0, 0, 0, 0.3);
    z-index: 10;
    @include screen-lg {
      width: 100vw;
    }
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
}
.bottomSvg {
  @include screen-lg {
    display: none;
  }
}
</style>
