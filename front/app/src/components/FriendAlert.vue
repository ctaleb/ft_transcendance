<template>
  <div :class="'alert-viewport' + (show ? ' show' : '')">
    <video ref="videoPlayer" :src="follow_alert_src"></video>
  </div>
</template>

<script setup lang="ts">
import { onMounted, Ref, ref } from "vue";
import follow_alert_src from "../assets/alert_follow.webm";

const videoPlayer: Ref<HTMLVideoElement | null> = ref(null);
const show = ref(false);

onMounted(() => {
  let play = () => {
    show.value = false;
    setTimeout(() => {
      show.value = true;
      videoPlayer.value?.play();
    }, 1000);
  };

  videoPlayer.value?.addEventListener("ended", play);
  play();
});
</script>

<style lang="scss">
.alert-viewport {
  display: none;
  width: 242px;
  height: 160px;
  position: fixed;
  overflow: hidden;

  animation-name: friend-alert;
  animation-duration: 1s;
  animation-timing-function: ease-out;

  bottom: 0px;
  right: 0;

  &.show {
    display: block;
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
