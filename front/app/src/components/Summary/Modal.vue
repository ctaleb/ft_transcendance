<template>
  <div class="modal">
    <PlayerInfo :player="data.host" :opponent="opponent" :host="host" :result="data.host.id === data.winnerID" />
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
    <PlayerInfo :player="data.client" :opponent="opponent" :host="host" :result="data.client.id === data.winnerID" />
  </div>
</template>

<script setup lang="ts">
import { GameSummaryData } from "@/types/GameSummary";
import { User } from "@/types/User";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { onMounted, ref } from "vue";
import PlayerInfo from "./PlayerInfo.vue";

dayjs.extend(utc);

const props = defineProps<{
  title: string;
  data: GameSummaryData;
  opponent: User;
  host: User;
  start: string;
  end: string;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();
</script>

<style lang="scss" scoped>
@import "../../styles/inputsAndButtons";
@import "../../styles/variables";
@import "../../styles/mixins/sizes";
.modal {
  display: flex;
  justify-content: space-between;
  background-color: $secondary !important;
  color: $primary;
  @include screen-lg {
    width: 90vw;
  }
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
