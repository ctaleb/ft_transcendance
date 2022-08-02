<template>
<div>
    <div class="alert alert-primary" role="alert">
      If this is visible, leo messi fourmau has set up bootstrap !
    </div>
  <p class="text-success" @click="increment()">{{ number }}</p>
  <input type="text" name="hey" id="ho" v-model="text" />
  <h2 class="text-warning">{{ text }}</h2>
  <div class="row mt-3">
  <div class="col-sm-6">
    <div class="card">
      <div class="card-body">
        <h5 class="card-title">Special title treatment</h5>
        <p class="card-text">With supporting text below as a natural lead-in to additional content.</p>
        <a href="#" class="btn btn-primary">Go somewhere</a>
      </div>
    </div>
  </div>
  <div class="col-sm-6">
    <div class="card">
      <div class="card-body">
        <h5 class="card-title">Special title treatment</h5>
        <p class="card-text">With supporting text below as a natural lead-in to additional content.</p>
        <a href="#" class="btn btn-primary">Go somewhere</a>
      </div>
    </div>
  </div>
</div>
</div>
</template>

<script lang="ts">
export default {
  data() {
    return {
      text: "",
      number: 1,
    };
  },
};
</script>

<style scoped>
p {
  user-select: none;
}
</style>

<style>

</style>
