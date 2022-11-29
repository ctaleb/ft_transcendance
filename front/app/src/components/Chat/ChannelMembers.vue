<template>
  <div class="channel-members">
    <template v-for="member in (<Channel>store.currentChat).members">
      <MemberVue :member="member" :me="me" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { fetchJSONDatas } from "@/functions/funcs";
import { useStore } from "@/store";
import { Channel, ChannelUser, isChannel } from "@/types/Channel";
import { Conversation } from "@/types/Conversation";
import { User } from "@/types/User";
import MemberVue from "@/components/chat/Member.vue";
import { onMounted, onUpdated, Ref, ref, watch } from "vue";
import { userInfo } from "os";

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
