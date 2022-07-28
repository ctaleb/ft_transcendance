<template>
<div>
    <div class="alert alert-primary" role="alert">
      If this is visible, leo messi fourmau has set up bootstrap !
    </div>
  <p class="text-success" @click="increment()">{{ number }}</p>
  <input type="text" name="hey" id="ho" v-model="text" />
  <h2 class="text-warning">{{ text }}</h2>
</div>
</template>

<script lang="ts">
import TestComponent from "../components/TestComponent.vue";
export default {
  components: {
    TestComponent,
  },
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
