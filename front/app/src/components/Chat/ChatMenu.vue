<template>
  <div class="chat-menu">
    <CollapseList title="Conversations" :data="convs" v-slot="{ element }: { element: Conversation }">
      <ChatMenuItem :title="Conversation.getName(element)" :picture="Conversation.getAvatar(element)" />
    </CollapseList>
    <CollapseList title="Channels" :data="channels" v-slot="{ element }: { element: Channel }">
      <ChatMenuItem :title="Channel.getName(element)" />
    </CollapseList>
    <hr />
    <CollapseList title="Friends" :data="store.user?.friends" v-slot="{ element }: { element: User }">
      <ChatMenuItem @click="User.createConversation(element)" :title="User.getName(element)" :picture="User.getAvatar(element)" />
    </CollapseList>
    <CollapseList title="Avaliable channels" :data="channels" v-slot="{ element }: { element: User }">
      <ChatMenuItem :title="User.getName(element)" />
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

const props = defineProps<{
  current: Channel | Conversation;
  channels: Channel[];
  convs: Conversation[];
}>();

const store = useStore();
</script>
