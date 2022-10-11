<template>
  <section>
    <h2>{{ props.player.score }}</h2>
    <h3>{{ props.player.name }}</h3>
    <div class="player">
      <img
        src="https://t3.ftcdn.net/jpg/03/47/77/38/360_F_347773818_LLKm2Y5S6mYlp26pkIYFbN1VMGW03PbF.jpg"
        alt=""
      />
      <div>
        <span
          >{{ props.player.elo }}
          <span v-if="props.player.eloChange >= 0" class="green">
            + {{ props.player.eloChange }}
          </span>
          <span v-else class="red">
            - {{ Math.abs(props.player.eloChange) }}
          </span>
        </span>
      </div>
    </div>
    <!-- <div class="power">
      <p>{{ props.player.power }}</p>
    </div> -->
  </section>
</template>

<script setup lang="ts">
import { PlayerInfoData } from "@/types/GameSummary";

const props = defineProps<{
  player: PlayerInfoData;
}>();
</script>

<style lang="scss" scoped>
section {
  height: 90%;
  width: 33%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  & > .player {
    display: flex;
    align-items: flex-end;

    height: 8em;
    width: 8em;
    border-radius: 50%;
    position: relative;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
    }

    div {
      position: absolute;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 25%;
      width: 100%;
      background-color: rgba(0, 0, 0, 0.8);

      & > span {
        font-weight: 500;
        font-size: 0.8rem;

        & > .green {
          color: #19aa19;
        }

        & > .red {
          color: #ee5050;
        }
      }
    }
  }
}
</style>
