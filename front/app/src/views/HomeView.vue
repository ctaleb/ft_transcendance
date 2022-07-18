<template>
  <p class="greeting" @click="increment()">{{ number }}</p>
  <input type="text" name="hey" id="ho" v-model="text" />
  <h2>{{ text }}</h2>
</template>

<script>
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
  methods: {
    increment() {
      this.number++;
    },
  },
};
</script>

<style scoped>
p {
  user-select: none;
}
</style>

<style>
.greeting {
  color: red;
  font-weight: bold;
}
</style>
