<template>
  <nav>
    <h3>{{ title }}</h3>
    <ul>
      <li v-for="el in data">
        <slot :element="el"></slot>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  data: any[] | undefined;
}>();
</script>
