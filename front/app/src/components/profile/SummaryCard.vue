<template>
  <li class="summary">
    <div :class="'border-gold insideSummary ' + getGameResultClass()">
      <img
        class="border-gold user-image left"
        :src="getUserAvatar(summary.host)"
        alt=""
      />
      <div class="playerName">
        <h3>{{ summary.host.nickname }}</h3>
        <h4>{{ "ELO : " + summary.hostElo + " " + summary.eloChange }}</h4>
      </div>
      <h3>{{ summary.hostScore }}</h3>
      <div style="position: relative">
        <!-- <h2 :class="getGameResultClass() + 'Text'">{{ getGameResult() }}</h2> -->
        <h2 :class="getGameResultClass() + 'Text'">{{ "VS" }}</h2>
      </div>
      <h3>{{ summary.clientScore }}</h3>
      <div class="playerName">
        <h3>{{ summary.client.nickname }}</h3>
        <h4>{{ "ELO : " + summary.clientElo + " " + summary.eloChange }}</h4>
      </div>
      <img
        class="border-gold user-image right"
        :src="getUserAvatar(summary.client)"
        alt=""
      />
    </div>
  </li>
</template>

<script lang="ts" setup>
import { getUserAvatar } from "@/functions/funcs";
import { useStore } from "@/store";
import { GameSummaryData, User, History } from "@/types/GameSummary";
import { useRouter } from "vue-router";

const props = defineProps<{
  summary: History;
}>();

const router = useRouter();
const store = useStore();

const isUserWinner = (): boolean => {
  let userScore, opponentScore;

  if (store.user?.nickname == props.summary.host.nickname) {
    userScore = props.summary.hostScore;
    opponentScore = props.summary.clientScore;
  } else {
    userScore = props.summary.clientScore;
    opponentScore = props.summary.hostScore;
  }

  return userScore > opponentScore;
};

const getGameResult = () => {
  return isUserWinner() ? "Victory" : "Defeat";
};

const getGameResultClass = () => {
  return isUserWinner() ? "victory" : "defeat";
};
</script>

<style lang="scss"></style>
