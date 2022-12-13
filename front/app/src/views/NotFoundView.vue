<template>
  <div>
    <img src="../assets/404.gif" alt="" />
  </div>
</template>

<style lang="scss" scoped>
@import "../styles/mixins/sizes";
div {
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 103px);
  width: 100vw;
  @include screen-md {
    height: calc(100vh - 130px);
    img {
      width: 100%;
    }
  }
}
</style>
