<template>
	<div class="ChannelInfo"></div>
</template>

<script setup lang="ts">
import { useStore } from "@/store";
import { Channel } from "@/types/Channel";
import { Conversation } from "@/types/Conversation";
import { User } from "@/types/User";
import { onMounted, onUpdated, Ref, ref } from "vue";

const store = useStore();

store.$subscribe((mutation, state) => {});

onMounted(() => {});
</script>
