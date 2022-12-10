<template>
  <div class="modal">
    <h1>The website is already opened on another tab or window !</h1>
  </div>
</template>

<script setup lang="ts">
// const emit = defineEmits<{
//   (e: "confirmGame"): void;
//   (e: "denyGame"): void;
// }>();
</script>

<style lang="scss" scoped>
.modal {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  width: 100%;
  height: 100%;
  max-width: none;
  div {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
  }
}
</style>
