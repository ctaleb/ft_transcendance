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
      <ChatMenuItem @click="User.createConversation(element)" :title="User.getName(element)" :picture="User.getAvatar(element)" />
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
        offset === 0 ? (conversation.messages = data) : conversation.messages.push(data);
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
});
</script>
