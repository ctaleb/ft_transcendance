<template>
  <h1>{{ props.name }}</h1>
</template>

<script setup lang="ts">
import { defineProps } from "vue";

interface Props {
  name: string;
}

const props = defineProps<Props>();
</script>
