<template>
  <div class="items">
    <div class="sliderButton" @click="gotoPrev()">
      <img src="../assets/sliderLeftIcon.svg" alt="" />
    </div>
    <div class="item" id="exhaust" :style="anim ? 'animation: ease 1.3s slide' + anim + ';' : ''">
      <img class="user-image" :src="powers[current].image" />
      <div class="info">
        <h4>{{ powers[current].name }}</h4>
        <p>{{ powers[current].power }}</p>
      </div>
    </div>
    <div class="sliderButton" @click="anim ? '' : gotoNext()">
      <img src="../assets/sliderRightIcon.svg" alt="" />
    </div>
  </div>
</template>
<script setup lang="ts">
import exhaustUrl from "../assets/powers/exhaust.jpeg";
import shieldUrl from "../assets/powers/shield.png";
import teleportUrl from "../assets/powers/teleport.png";
import flashUrl from "../assets/powers/flash.jpeg";
import ghostUrl from "../assets/powers/ghost.png";
import { onMounted, ref } from "vue";

const emit = defineEmits(["update:modelValue"]);
const current = ref(0);
const anim = ref(0);

interface Power {
  name: string;
  image: any;
  power: string;
}

const powers: Power[] = [
  {
    name: "Exhaust",
    image: exhaustUrl,
    power: "Every 10 rounds, slow your opponent's bar during 3 hit",
  },
  {
    name: "Elastico",
    image: flashUrl,
    power: "Every 10 rounds, a bigger bar during 3 hit",
  },
  {
    name: "Smasher",
    image: shieldUrl,
    power: "Every 6 rounds, you can Smash hard",
  },
  {
    name: "Minimo",
    image: teleportUrl,
    power: "Every 9 rounds, minimize your opponent bar for 3 hit",
  },
  {
    name: "Ghost",
    image: ghostUrl,
    power: "Every 6 rounds, the ball becomes invisible for your opponent during 2 seconds",
  },
];

onMounted(() => {
  emit("update:modelValue", powers[current.value].name);
});

function gotoPrev() {
  anim.value = 2;
  setTimeout(() => {
    current.value > 0 ? current.value-- : (current.value = 4);
    emit("update:modelValue", powers[current.value].name);
  }, 750);
  setTimeout(() => {
    anim.value = 0;
  }, 1500);
}

function gotoNext() {
  anim.value = 1;
  setTimeout(() => {
    current.value < 4 ? current.value++ : (current.value = 0);
    emit("update:modelValue", powers[current.value].name);
  }, 750);
  setTimeout(() => {
    anim.value = 0;
  }, 1500);
}
</script>

<style lang="scss" scoped>
@import "../styles/_inputsAndButtons.scss";
</style>
