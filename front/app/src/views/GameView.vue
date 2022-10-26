<template>
  <game-component />
  <friend-alert :requester-name="props.incomingFriendRequest" />
</template>

<script setup lang="ts">
import { ref } from "vue";
import GameComponent from "../components/GameComponent.vue";
import FriendAlert from "../components/FriendAlert.vue";

const props = defineProps(["incomingFriendRequest"]);
const emit = defineEmits(["notification"]);
</script>

<style scoped>
p {
  user-select: none;
}

.greeting {
  color: red;
  font-weight: bold;
}
</style>
