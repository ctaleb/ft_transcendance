<template>
  <div class="modal">
    <PlayerInfo :player="data.host" :opponent="opponent" :result="data.host.score > data.client.score" />
    <div class="midSection">
      <h2>{{ title }}</h2>
      <p>{{ dayjs(start).format("DD/MM/YY") }}</p>
      <p>
        {{
          dayjs(dayjs(end).diff(dayjs(start)))
            .utc()
            .format("HH:mm:ss")
        }}
      </p>
      <h2>VS</h2>
      <button class="button" @click="$emit('close')">Close</button>
    </div>
    <PlayerInfo :player="data.client" :opponent="opponent" :result="data.host.score < data.client.score" />
  </div>
</template>

<script setup lang="ts">
import { GameSummaryData } from "@/types/GameSummary";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { onMounted, ref } from "vue";
import PlayerInfo from "./PlayerInfo.vue";

dayjs.extend(utc);

const props = defineProps<{
  title: string;
  data: GameSummaryData;
  opponent: string;
  start: Date;
  end: Date;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();
</script>

<style lang="scss" scoped>
@import "../../styles/inputsAndButtons";
@import "../../styles/variables";
.modal {
  display: flex;
  justify-content: space-between;
  background-color: $secondary !important;
  color: $primary;
  .midSection {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    .button {
      margin-top: auto;
    }
  }
}
</style>
