<template>
  <div class="modal">
    <PlayerInfo :player="props.data.host" />
    <div class="midSection">
      <h2>{{ props.title }}</h2>
      <p>{{ dayjs(props.start).format("DD/MM/YY") }}</p>
      <p>
        {{ dayjs(dayjs(props.end).diff(props.start)).format("hh:mm:ss") }}
      </p>
      <h2>VS</h2>
      <button class="button" @click="$emit('close')">Close</button>
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
  background-color: $secondary;
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
