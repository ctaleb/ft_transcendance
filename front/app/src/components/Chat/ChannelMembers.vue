<template>
  <div class="channel-members">
    <template v-for="member in (<Channel>store.currentChat).members">
      <MemberVue :member="member" :me="me" />
    </template>
  </div>
</template>

<script setup lang="ts">
import MemberVue from "@/components/chat/Member.vue";
import { fetchJSONDatas } from "@/functions/funcs";
import { useStore } from "@/store";
import { Channel, ChannelUser, isChannel } from "@/types/Channel";
import { onMounted, Ref, ref, watch } from "vue";

const store = useStore();
const me: Ref<ChannelUser> = ref((<Channel>store.currentChat!).members!.find((member) => member.id === store.user!.id)!);
let socket = store.socket;

store.$subscribe((mutation, state) => {
  socket = state.socket;
});

onMounted(() => {
  watch(
    () => store.currentChat!.id,
    () => {
      me.value = (<Channel>store.currentChat!).members!.find((member) => member.id === store.user!.id)!;
    }
  );
});
</script>
