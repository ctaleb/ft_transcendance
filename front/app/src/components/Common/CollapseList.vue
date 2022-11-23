<template>
  <nav>
    <h3 @click="toggle">{{ title }}</h3>
    <ul v-if="show">
      <li v-for="element in data">
        <slot :element="element"></slot>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  toggleMode: boolean,
  title: string;
  data: any[] | undefined;
}>();

const show = ref(props.toggleMode);

const toggle = () => {
  show.value = !show.value;
};
</script>
