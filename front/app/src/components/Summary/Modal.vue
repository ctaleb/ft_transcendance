<template>
  <div class="modal">
    <PlayerInfo :player="props.data.host" />
    <div>
      <h2>{{ props.title }}</h2>
      <p>{{ dayjs(props.data.start).format("DD/MM/YY") }}</p>
      <p>
        {{
          dayjs(dayjs(props.data.end).diff(props.data.start)).format("mm:ss")
        }}
      </p>
      <div class="versus">VS</div>
      <button @click="$emit('close')">Close</button>
    </div>
    <PlayerInfo :player="props.data.client" />
  </div>
</template>

<script setup lang="ts">
import { GameSummaryData } from "@/types/GameSummary";
import PlayerInfo from "./PlayerInfo.vue";
import dayjs from "dayjs";

const props = defineProps<{
  title: String;
  data: GameSummaryData;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();
</script>

<style lang="scss" scoped>
.modal {
  display: flex;
  justify-content: space-between;
  color: #bcaf7b;

  &:deep(p),
  &:deep(h2),
  &:deep(h3) {
    margin: 0;
  }

  &:deep(h2) {
    font-size: 2.5rem;
  }

  &:deep(h3) {
    font-weight: normal;
    font-size: 1.5rem;
    margin-bottom: 10px;
  }

  & > div {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-content: center;
    justify-content: space-between;
    .titleVictory {
      display: flex;
      flex-direction: column;
      justify-content: center;
      font-size: 4vw;
      .date {
        font-size: 1vw;
      }
      .time {
        font-size: 1vw;
      }
    }
    .versus {
      height: 50%;
      font-size: 7vw;
      font-weight: bolder;
      color: #bcaf7b;
    }
    .closeButton {
      position: absolute;
      bottom: 0;
    }
  }
}
</style>
