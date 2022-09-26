<template>
  <div class="items">
		<div class="item active">
			<img src="https://static.onzemondial.com/photos/283770/carre-psg--la-toile-encourage-mbapp%C3%A9-pour-le-choc-face-au-rb-leipzig.jpg">
		</div>
		<div class=" item next">
			<img src="https://static.onzemondial.com/photos/283770/carre-psg--la-toile-encourage-mbapp%C3%A9-pour-le-choc-face-au-rb-leipzig.jpg">
		</div>
		<div class="item">
			<img src="https://static.onzemondial.com/photos/283770/carre-psg--la-toile-encourage-mbapp%C3%A9-pour-le-choc-face-au-rb-leipzig.jpg">
		</div>
		<div class="item">
			<img src="https://static.onzemondial.com/photos/283770/carre-psg--la-toile-encourage-mbapp%C3%A9-pour-le-choc-face-au-rb-leipzig.jpg">
		</div>
		<div class="item prev">
			<img src="https://static.onzemondial.com/photos/283770/carre-psg--la-toile-encourage-mbapp%C3%A9-pour-le-choc-face-au-rb-leipzig.jpg">
		</div>
		<div class="button-container">
			<div class="button"><font-awesome-icon  icon="fa-solid fa-toilet-paper"/></div>
			<div class="button"><font-awesome-icon  icon="fa-solid fa-toilet-paper"/></div>
		</div>
	</div>
</template>
<script lang="ts" >

  import "./style.css";

export default{
  mounted(){
    // I will be creating a different pen with touch support but right // now I have no time for it due to school

const slider = document.querySelector(".items");
const slides = document.querySelectorAll(".item");
const button = document.querySelectorAll(".button");

let current = 0;
let prev = 4;
let next = 1;

for (let i = 0; i < button.length; i++) {
  button[i].addEventListener("click", () => i == 0 ? gotoPrev() : gotoNext());
}

const gotoPrev = () => current > 0 ? gotoNum(current - 1) : gotoNum(slides.length - 1);

const gotoNext = () => current < 4 ? gotoNum(current + 1) : gotoNum(0);

const gotoNum = (number: number) => {
  current = number;
  prev = current - 1;
  next = current + 1;

  for (let i = 0; i < slides.length; i++) {
    slides[i].classList.remove("active");
    slides[i].classList.remove("prev");
    slides[i].classList.remove("next");
  }

  if (next == 5) {
    next = 0;
  }

  if (prev == -1) {
    prev = 4;
  }

  slides[current].classList.add("active");
  slides[prev].classList.add("prev");
  slides[next].classList.add("next");
  }
}
}
</script>

