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
import { socketLocal, useStore } from "@/store";
import { Channel, ChannelUser, isChannel } from "@/types/Channel";
import { onMounted, Ref, ref, watch } from "vue";

const store = useStore();
const me: Ref<ChannelUser> = ref((<Channel>store.currentChat!).members!.find((member) => member.id === store.user!.id)!);

onMounted(() => {
  watch(
    () => store.currentChat!.id,
    () => {
      me.value = (<Channel>store.currentChat!).members!.find((member) => member.id === store.user!.id)!;
    }
  );
  // watch(
  //   () => store.socket,
  //   () => {
  //chat listeners
  if (!socketLocal.value?.hasListeners("updateChannelMembers")) {
    socketLocal.value?.on("updateChannelMembers", async (channelId: number) => {
      if (store.currentChat && isChannel(store.currentChat) && channelId === store.currentChat.id) {
        await fetchJSONDatas("api/chat/members", "POST", {
          id: store.currentChat!.id,
        })
          .then((data) => {
            console.log(data);
            store.$patch({
              currentChat: { members: data },
            });
          })
          .catch(() => {});
      }
    });
  }
  //   }
  // );
});
</script>
