<template>
  <section>
    <h2>{{ player.score }}</h2>
    <h3>{{ player.name }}</h3>
    <div class="player">
      <img v-if="player.name === opponent.nickname" :src="User.getAvatar(opponent)" alt="" />
      <img v-else :src="User.getAvatar(host)" alt="" />
      <div>
        <span
          >{{ player.elo }}
          <span v-if="result" class="green"> + {{ player.eloChange }} </span>
          <span v-else class="red"> - {{ player.eloChange }} </span>
        </span>
      </div>
    </div>
    <!-- <div class="power">
      <p>{{ props.player.power }}</p>
    </div> -->
  </section>
</template>

<script setup lang="ts">
import { useStore } from "@/store";
import { PlayerInfoData } from "@/types/GameSummary";
import { User } from "@/types/User";

const store = useStore();

const props = defineProps<{
  player: PlayerInfoData;
  result: boolean;
  opponent: User;
  host: User;
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
