<template>
  <div :class="'alert-viewport' + (show ? ' show' : '')">
    <p class="alert-top-element">Incoming friend request</p>
    <p class="alert-bot-element">{{ props.requesterName }}</p>
    <video ref="videoPlayer" muted="muted" :src="follow_alert_src"></video>
  </div>
</template>

<script setup lang="ts">
import { onMounted, Ref, ref, watch } from "vue";
import follow_alert_src from "../assets/alert_follow.webm";

const videoPlayer: Ref<HTMLVideoElement | null> = ref(null);
const show = ref(false);

const props = defineProps(["requesterName"]);

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
    top: 35%;
    width: 50%;
    z-index: 5;
    color: white;
    font-size: 1.4em;
  }

  .alert-bot-element {
    position: absolute;
    left: 25%;
    top: 45%;
    width: 50%;
    z-index: 5;
    color: white;
    font-size: 1.4em;
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
