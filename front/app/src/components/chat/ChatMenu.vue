<template>
  <div class="chat-menu">
    <CollapseList :toggleMode="true" title="Conversations" :data="privateConvs" v-slot="{ element }: { element: Conversation }">
      <ChatMenuItem
        @contextmenu.prevent="showUserMenu($event, element.other)"
        @set-current-chat-window="setCurrentChatWindow(element)"
        :title="Conversation.getName(element)"
        :picture="Conversation.getAvatar(element)"
      />
    </CollapseList>
    <CollapseList :toggleMode="true" title="Channels" :data="channels" v-slot="{ element }: { element: Channel }">
      <ChatMenuItem @set-current-chat-window="setCurrentChatWindow(element)" :title="Channel.getName(element)" />
    </CollapseList>
    <CollapseList :toggleMode="false" title="Friends" :data="friends" v-slot="{ element }: { element: User }">
      <ChatMenuItem
        @contextmenu.prevent="showUserMenu($event, element)"
        @click="createConversation(element)"
        :title="User.getName(element)"
        :picture="User.getAvatar(element)"
      />
    </CollapseList>
    <div class="menuBottomButtons">
      <button class="button" @click="showAllChannelsModal = true">All Channels</button>
      <button class="button" @click="showInvitationsModal = true">Invitations</button>
      <button class="button" @click="showChannelModal = true">Create new channel</button>
    </div>
  </div>
  <div class="responsiveMenuBottomButtons">
    <button class="button" @click="showAllChannelsModal = true">All Channels</button>
    <button class="button" @click="showInvitationsModal = true">Invitations</button>
    <button class="button" @click="showChannelModal = true">New channel</button>
  </div>
  <AllChannelsModal v-if="showAllChannelsModal" @close-all-channels-modal="showAllChannelsModal = false" @join-channel="joiningNewChannel" />
  <InvitationsModal v-if="showInvitationsModal" @join-private-channel="joiningNewPrivateChannel" @close-invitations-modal="showInvitationsModal = false" />
  <ChannelCreateFormModal v-if="showChannelModal" @close-channel-modal="showChannelModal = false" @create-new-channel="createNewChannel" />
</template>

<script setup lang="ts">
import ChatMenuItem from "@/components/chat/ChatMenuItem.vue";
import AllChannelsModal from "@/components/chat/modals/AllChannelsModal.vue";
import ChannelCreateFormModal from "@/components/chat/modals/ChannelCreateFormModal.vue";
import InvitationsModal from "@/components/chat/modals/InvitationsModal.vue";
import CollapseList from "@/components/common/CollapseList.vue";
import { fetchJSONDatas, showUserMenu } from "@/functions/funcs";
import { privateConvs, socketLocal, useStore } from "@/store";
import { Channel, ChannelType, isChannel } from "@/types/Channel";
import { Conversation } from "@/types/Conversation";
import { transformDate } from "@/types/Message";
import { User } from "@/types/User";
import { onMounted, onUnmounted, Ref, ref, watch } from "vue";

const props = defineProps<{
  channels: Channel[];
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

const store = useStore();
const friends: Ref<User[] | undefined> = ref([]);
const showAllChannelsModal = ref(false);
const showInvitationsModal = ref(false);
const showChannelModal = ref(false);

const createConversation = async (element: User) => {
  const conv: any = await User.createConversation(element);
  if (conv.created) {
    const newConv: Conversation = { id: conv.conv.id, other: element, messages: [] };
    privateConvs.value.unshift(newConv);
    socketLocal.value?.emit("friendToConv", { target: newConv.other.nickname });
    friends.value = store.user?.friends?.filter((user) => !privateConvs.value.find((conv) => conv.other.id === user.id));
    setCurrentChatWindow(newConv);
  }
};

const joiningNewPrivateChannel = (channel: any) => {
  const data: Channel = channel;
  props.channels.push(data);
  socketLocal.value?.emit("joinChannelRoom", { id: data.id });
  showInvitationsModal.value = false;
};

const joiningNewChannel = (channel: any) => {
  const data: Channel = channel;
  socketLocal.value?.emit("joinChannelRoom", { id: data.id });
  props.channels.push(data);
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
        for (let i = 0; i < data.messages.length; i++) data.messages[i] = transformDate(data.messages[i]);
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
    const conversation: Conversation = <Conversation>target;
    await fetchJSONDatas(`api/privateConv/getMessages/${conversation.id}/0`, "GET")
      .then((data) => {
        if (data.length > 0) conversation.messages = data;
        else conversation.messages = [];
        for (let i = 0; i < conversation.messages.length; i++) conversation.messages[i] = transformDate(conversation.messages[i]);
        store.currentChat = conversation;
      })
      .catch(() => {
        store.$patch({
          currentChat: undefined,
        });
      });
  }
};

store.$subscribe((mutation, state) => {
  friends.value = store.user?.friends?.filter((user) => !privateConvs.value.find((conv) => conv.other.id === user.id));
});

onMounted(() => {
  watch(
    () => privateConvs.value,
    () => {
      friends.value = store.user?.friends?.filter((user) => !privateConvs.value.find((conv) => conv.other.id === user.id));
    }
  );
  if (socketLocal.value) {
    socketLocal.value?.on("friendTooConv", async (friendId: number) => {
      await fetchJSONDatas(`api/privateConv/create/${friendId}`, "GET")
        .then((data) => {
          privateConvs.value.unshift(data.conv);
          friends.value = store.user?.friends?.filter((user) => !privateConvs.value.find((conv) => conv.other.id === user.id));
        })
        .catch(() => {});
    });
    socketLocal.value?.on("channelUpdatd", (data: { id: number; name: string; type: ChannelType }) => {
      const index = props.channels.findIndex((el) => el.id === data.id);
      if (index !== -1) {
        props.channels[index].type = data.type;
      }
    });
    socketLocal.value?.on("newConv", async (userId: number) => {
      await fetchJSONDatas(`api/privateConv/create/${userId}`, "GET")
        .then((data) => {
          privateConvs.value.unshift(data.conv);
        })
        .catch(() => {});
    });
  }
  watch(
    () => socketLocal.value,
    () => {
      socketLocal.value?.removeListener("friendTooConv");
      socketLocal.value?.on("friendTooConv", async (friendId: number) => {
        await fetchJSONDatas(`api/privateConv/create/${friendId}`, "GET")
          .then((data) => {
            privateConvs.value.unshift(data.conv);
            friends.value = store.user?.friends?.filter((user) => !privateConvs.value.find((conv) => conv.other.id === user.id));
          })
          .catch(() => {});
      });
      socketLocal.value?.removeListener("channelUpdatd");
      socketLocal.value?.on("channelUpdatd", (data: { id: number; name: string; type: ChannelType }) => {
        const index = props.channels.findIndex((el) => el.id === data.id);
        if (index !== -1) {
          props.channels[index].type = data.type;
        }
      });
      socketLocal.value?.removeListener("newConv");
      socketLocal.value?.on("newConv", async (userId: number) => {
        await fetchJSONDatas(`api/privateConv/create/${userId}`, "GET")
          .then((data) => {
            privateConvs.value.unshift(data.conv);
          })
          .catch(() => {});
      });
    }
  );
});

onUnmounted(() => {
  socketLocal.value?.removeListener("channelUpdatd");
  socketLocal.value?.removeListener("newConv");
  socketLocal.value?.removeListener("friendTooConv");
});
</script>

<style lang="scss" scoped>
@import "../../styles/mixins/sizes";
.menuBottomButtons {
  @include screen-md {
    display: none;
    width: 100%;
  }
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-top: auto;
  button {
    width: 100%;
  }
}
.responsiveMenuBottomButtons {
  @include screen-md {
    display: flex;
    justify-content: center;
    align-items: center;
    overflow-y: scroll;
    width: 100%;
    height: 5%;
  }
  @include screen-xs {
    width: 100%;
    height: 5%;
  }
  width: 100%;
  display: none;
  button {
    width: 100%;
  }
}
</style>
