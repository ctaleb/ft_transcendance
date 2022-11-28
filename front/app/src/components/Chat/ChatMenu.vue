<template>
  <div class="chat-menu">
    <CollapseList :toggleMode="true" title="Conversations" :data="convs" v-slot="{ element }: { element: Conversation }">
      <ChatMenuItem
        @set-current-chat-window="setCurrentChatWindow(element)"
        :title="Conversation.getName(element)"
        :picture="Conversation.getAvatar(element)"
      />
    </CollapseList>
    <CollapseList :toggleMode="true" title="Channels" :data="channels" v-slot="{ element }: { element: Channel }">
      <ChatMenuItem @set-current-chat-window="setCurrentChatWindow(element)" :title="Channel.getName(element)" />
    </CollapseList>
    <hr />
    <CollapseList :toggleMode="false" title="Friends" :data="friends" v-slot="{ element }: { element: User }">
      <ChatMenuItem @click="createConversation(element)" :title="User.getName(element)" :picture="User.getAvatar(element)" />
    </CollapseList>
    <CollapseList :toggleMode="false" title="Channel invitations" :data="invitations" v-slot="{ element }: { element: Channel }">
      <ChatMenuItem :title="Channel.getName(element)" />
    </CollapseList>
    <CollapseList :toggleMode="false" title="Avaliable channels" :data="allChannels" v-slot="{ element }: { element: Channel }">
      <ChatMenuItem :title="Channel.getName(element)" />
    </CollapseList>
  </div>
</template>

<script setup lang="ts">
import ChatMenuItem from "@/components/chat/ChatMenuItem.vue";
import CollapseList from "@/components/common/CollapseList.vue";
import { fetchJSONDatas } from "@/functions/funcs";
import { useStore } from "@/store";
import { Channel, isChannel } from "@/types/Channel";
import { Conversation } from "@/types/Conversation";
import { User } from "@/types/User";
import { onMounted, onUpdated, Ref, ref, watch } from "vue";

const props = defineProps<{
  channels: Channel[];
  allChannels: Channel[];
  convs: Conversation[];
  invitations: Channel[];
}>();

const emits = defineEmits<{
  (e: "setCurrentChatWindow"): void;
}>();

const friends: Ref<User[] | undefined> = ref();

const store = useStore();
let socket = store.socket;

store.$subscribe((mutation, state) => {
  socket = state.socket;
});

const createConversation = async (element: User) => {
  const conv: any = await User.createConversation(element);
  if (conv.created) {
    let newConv: Conversation = { id: conv.conv.id, other: element, notif: false, messages: [] };
    friends.value = friends.value?.splice(friends.value.indexOf(element), 1);
    props.convs.unshift(newConv);
    console.log(props.convs);
  }
};

const setCurrentChatWindow = async (target: Channel | Conversation) => {
  if (isChannel(target)) {
    const channel = <Channel>target;
    await fetchJSONDatas("api/chat/load-channel", "POST", {
      id: channel.id,
    })
      .then((data) => {
        channel.members = data.members;
        channel.messages = data.messages;
        store.$patch({
          currentChat: channel,
        });
      })
      .catch(() => {
        store.$patch({
          currentChat: undefined,
        });
      });
  } else {
    const conversation = <Conversation>target;
    const offset: number = conversation.messages ? conversation.messages.length : 0;
    await fetchJSONDatas(`api/privateConv/getMessages/${conversation.id}/${offset}`, "GET")
      .then((data) => {
        if (data.length > 0) conversation.messages = data;
        store.$patch({
          currentChat: conversation,
        });
      })
      .catch(() => {
        store.$patch({
          currentChat: undefined,
        });
      });
  }
};

onMounted(() => {
  watch(
    () => props.convs,
    () => {
      friends.value = store.user?.friends?.filter((user) => !props.convs.find((conv) => conv.other.id === user.id));
    }
  );
  socket?.on("Update conv list", (convData: { conv: Conversation }) => {
    console.log("Conv");
    console.log(convData);
    const convIndex = props.convs.findIndex((conv) => conv.id === convData.conv.id);
    const convToTop = props.convs.splice(convIndex, 1)[0];
    props.convs.splice(0, 0, convToTop);
  });
});
</script>
