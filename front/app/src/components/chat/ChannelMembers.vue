<template>
  <div class="channel-members">
    <template v-for="member in (<Channel>store.currentChat).members">
      <MemberVue :member="member" :me="me" />
    </template>
  </div>
</template>

<script setup lang="ts">
import MemberVue from "@/components/chat/Member.vue";
import { useStore } from "@/store";
import { Channel, ChannelUser } from "@/types/Channel";
import { onMounted, Ref, ref, watch } from "vue";

const store = useStore();
const me: Ref<ChannelUser> = ref((<Channel>store.currentChat!).members!.find((member) => member.id === store.user!.id)!);

store.$subscribe((mutation, state) => {
  if ((<Channel>state.currentChat)?.members) me.value = (<Channel>store.currentChat!).members!.find((member) => member.id === store.user!.id)!;
});

onMounted(() => {
  watch(
    () => store.currentChat,
    () => {
      if (store.currentChat && (<Channel>store.currentChat).members)
        me.value = (<Channel>store.currentChat!).members!.find((member) => member.id === store.user!.id)!;
    }
  );
});
</script>
