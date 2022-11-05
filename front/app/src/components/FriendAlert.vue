<template>
  <div :class="'alert-viewport' + (show ? ' show' : '')">
    <p class="alert-top-element">Incoming friend request</p>
    <p class="alert-bot-element">{{ props.requesterName }}</p>
    <video ref="videoPlayer" muted="muted" :src="follow_alert_src"></video>
  </div>
</template>

<script setup lang="ts">
import { onMounted, Ref, ref, watch } from "vue";
import { useRoute } from "vue-router";
import follow_alert_src from "../assets/alert_follow.webm";

const videoPlayer: Ref<HTMLVideoElement | null> = ref(null);
const show = ref(false);
const route = useRoute();

const props = defineProps<{
  requesterName: string;
}>();
const emit = defineEmits<{
  (e: "updateInvitations"): void;
}>();

onMounted(() => {
  let play = () => {
    if (props.requesterName.length > 0) {
      show.value = false;
      setTimeout(() => {
        show.value = true;
        videoPlayer.value?.play();
      }, 1000);
      setTimeout(() => {
        show.value = false;
      }, 4900);
    }
  };

  // videoPlayer.value?.addEventListener("ended", () => {
  //   show.value = false;
  // });

  watch(
    () => props.requesterName,
    () => {
      play();
      if (route.path === "/profile") {
        emit("updateInvitations");
      }
    }
  );
});
</script>

<style lang="scss">
.alert-viewport {
  display: none;
  width: 25%;
  height: auto;
  position: fixed;
  overflow: hidden;

  animation-name: friend-alert;
  animation-duration: 1s;
  animation-timing-function: ease-out;

  top: 30%;
  right: 0;

  &.show {
    display: block;
  }

  .alert-top-element {
    position: absolute;
    left: 25%;
    top: 34%;
    width: 50%;
    z-index: 5;
    color: white;
    font-size: 1.4em;
    background-color: transparent;
  }

  .alert-bot-element {
    position: absolute;
    left: 25%;
    top: 44%;
    width: 50%;
    z-index: 5;
    color: white;
    font-size: 1.4em;
    background-color: transparent;
  }

  & > video {
    width: 100%;
    height: 100%;
  }

  @keyframes friend-alert {
    0% {
      right: -100%;
    }
    100% {
      right: 0;
    }
  }
}
</style>
