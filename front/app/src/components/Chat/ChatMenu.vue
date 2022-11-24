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
import { useStore } from "@/store";
import { Channel } from "@/types/Channel";
import { Conversation } from "@/types/Conversation";
import { User } from "@/types/User";
import { onMounted, onUpdated, Ref, ref } from "vue";

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
const setCurrentChatWindow = (target: Channel | Conversation) => {
  store.currentChat = target;
};

onMounted(() => {
  friends.value = store.user?.friends?.filter((user) => !props.convs.find((conv) => conv.other.id === user.id));
});
</script>
