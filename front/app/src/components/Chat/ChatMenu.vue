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
    <button @click="showAllChannelsModal = true">All Channels</button>
    <button @click="showInvitationsModal = true">Invitations</button>
    <button @click="showChannelModal = true">Create new channel</button>
  </div>
  <AllChannelsModal v-if="showAllChannelsModal" @close-all-channels-modal="showAllChannelsModal = false" @join-channel="joiningNewChannel" />
  <InvitationsModal v-if="showInvitationsModal" @join-private-channel="joiningNewPrivateChannel" @close-invitations-modal="showInvitationsModal = false" />
  <ChannelCreateFormModal v-if="showChannelModal" @close-channel-modal="showChannelModal = false" @create-new-channel="createNewChannel" />
</template>

<script setup lang="ts">
import ChatMenuItem from "@/components/chat/ChatMenuItem.vue";
import CollapseList from "@/components/common/CollapseList.vue";
import InvitationsModal from "@/components/chat/modals/InvitationsModal.vue";
import AllChannelsModal from "@/components/chat/modals/AllChannelsModal.vue";
import ChannelCreateFormModal from "@/components/chat/modals/ChannelCreateFormModal.vue";
import { fetchJSONDatas } from "@/functions/funcs";
import { useStore } from "@/store";
import { Channel, ChannelType, isChannel } from "@/types/Channel";
import { Conversation } from "@/types/Conversation";
import { User } from "@/types/User";
import { onMounted, onUpdated, Ref, ref, watch } from "vue";

const props = defineProps<{
  channels: Channel[];
  convs: Conversation[];
}>();

const emits = defineEmits([
  "joinChannel",
  "joinPrivateChannel",
  "setCurrentChatWindow",
  "createNewChannel",
  "closeAllChannelsModal",
  "closeInvitationsModal",
  "closeChannelModal",
]);

const friends: Ref<User[] | undefined> = ref();
const showAllChannelsModal = ref(false);
const showInvitationsModal = ref(false);
const showChannelModal = ref(false);

const store = useStore();

const createConversation = async (element: User) => {
  const conv: any = await User.createConversation(element);
  if (conv.created) {
    const newConv: Conversation = { id: conv.conv.id, other: element, notif: false, messages: [] };
    props.convs.unshift(newConv);
    store.socket?.emit("friendToConv", { target: newConv.other.nickname });
    friends.value = store.user?.friends?.filter((user) => !props.convs.find((conv) => conv.other.id === user.id));
  }
};

const joiningNewPrivateChannel = (channel: any) => {
  const data: Channel = channel;
  props.channels.push(data);
  store.socket?.emit("joinChannelRoom", { id: data.id });
  showInvitationsModal.value = false;
};

const joiningNewChannel = (channel: any) => {
  const data: Channel = channel;
  props.channels.push(data);
  store.socket?.emit("joinChannelRoom", { id: data.id });
  showAllChannelsModal.value = false;
};

const createNewChannel = (channel: Channel) => {
  props.channels.push(channel);
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
        else conversation.messages = [];
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
  watch(
    () => store.socket,
    () => {
      if (!store.socket?.hasListeners("friendTooConv")) {
        store.socket?.on("friendTooConv", async (friendId: number) => {
          const data = await fetchJSONDatas(`api/privateConv/create/${friendId}`, "GET").catch(() => {});
          props.convs.unshift(data.conv);
          friends.value = store.user?.friends?.filter((user) => !props.convs.find((conv) => conv.other.id === user.id));
        });
      }
      if (!store.socket?.hasListeners("Update conv list")) {
        store.socket?.on("Update conv list", (convData: { conv: Conversation }) => {
          const convIndex = props.convs.findIndex((conv) => conv.id === convData.conv.id);
          const convToTop = props.convs.splice(convIndex, 1)[0];
          props.convs.splice(0, 0, convToTop);
          friends.value = store.user?.friends?.filter((user) => !props.convs.find((conv) => conv.other.id === user.id));
        });
      }
      if (!store.socket?.hasListeners("channelUpdatd")) {
        store.socket?.on("channelUpdatd", (data: { id: number; name: string; type: ChannelType }) => {
          const index = props.channels.findIndex((el) => el.id === data.id);
          if (index !== -1) {
            props.channels[index].type = data.type;
          }
        });
      }
    }
  );
});
</script>
