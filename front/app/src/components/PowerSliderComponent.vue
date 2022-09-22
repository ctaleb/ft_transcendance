<template>
    <swiper
      :slides-per-view="4"
      :space-between="30"
      @swiper="onSwiper"
      @slideChange="onSlideChange"
      class="default-slider"
    >
      <swiper-slide v-for="n in 7" :key="n"> {{ n }} </swiper-slide>
    </swiper>
  </template>
  
  <style scoped>
  .default-slider .swiper-slide {
    display: flex;
    height: 300px !important;
    justify-content: center;
    align-items: center;
    color: #000;
    font-size: 24px;
    font-weight: 700;
  }
  .swiper-slide:nth-child(1n) {
    background-color: palevioletred;
  }
  .swiper-slide:nth-child(2n) {
    background-color: skyblue;
  }
  .swiper-slide:nth-child(3n) {
    background-color: peru;
  }
  .swiper-slide:nth-child(4n) {
    background-color: cadetblue;
  }
  .swiper-slide:nth-child(5n) {
    background-color: plum;
  }
  .swiper-slide:nth-child(6n) {
    background-color: goldenrod;
  }
  .swiper-slide:nth-child(7n) {
    background-color: palegreen;
  }
  </style>
  
  <script>
  // Import Swiper Vue.js components
  //import { SwiperSlide } from "swiper/vue/swiper-slide";
  import { Swiper, SwiperSlide } from "swiper/vue";
  // Import Swiper styles
  import "swiper/swiper.min.css";
  export default {
    components: {
      Swiper,
      SwiperSlide
    },
    methods: {
      onSwiper: function () {
        console.log("onSwiper called");
      },
      onSlideChange: function () {
        console.log("Slide change");
      },
    },
  };
  </script>