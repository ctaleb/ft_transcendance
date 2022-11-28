<template>
  <div class="chat-area">
    <div class="chat-messages">
      <button class="loadMoreButton" @click="loadMoreMessages()">Load more</button>
      <template v-for="(message, index) in store.currentChat?.messages">
        <div v-if="store.user?.nickname === message.author" class="msg-out">
          <div class="chat-message chat-message-out">
            <h5>{{ message.author }}</h5>
            <p>{{ message.text }}</p>
            <p class="date">{{ message.date }}</p>
          </div>
          <img class="user-image" :src="User.getAvatar(store.user)" alt="" />
        </div>
        <div v-else class="msg-in">
          <img class="user-image" :src="User.getAvatarByNickname(message.author, store.currentChat!)" alt="" />
          <div class="chat-message chat-message-in">
            <h4>{{ message.author }}</h4>
            <p>{{ message.text }}</p>
            <p class="date">{{ message.date }}</p>
          </div>
        </div>
      </template>
      <div ref="messagesBoxRef"></div>
    </div>
    <div class="chat-input">
      <div class="searchBar">
        <input type="text" class="searchField" name="messageField" v-model="messageField" placeholder="Write your message" />
      </div>
      <button @click="sendMessage()">Send message</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { addAlertMessage, fetchJSONDatas } from "@/functions/funcs";
import { useStore } from "@/store";
import { Channel, isChannel } from "@/types/Channel";
import { Conversation } from "@/types/Conversation";
import { Message } from "@/types/Message";
import { User } from "@/types/User";
import { findDir } from "@vue/compiler-core";
import { onMounted, onUpdated, Ref, ref } from "vue";

const store = useStore();

let socket = store.socket;
let loadMore = false;

const messageField = ref("");
const messagesBoxRef = ref<HTMLDivElement | null>(null);

const scrollDownMessages = (behavior: ScrollBehavior | undefined) => {
  messagesBoxRef.value?.scrollIntoView({ behavior, block: "end" });
};

const sendMessage = () => {
  if (messageField.value.length > 0) {
    if (isChannel(store.currentChat!)) {
      socket?.emit("sendChannelMessage", {
        channelId: store.currentChat!.id,
        content: messageField.value,
      });
    } else {
      socket?.emit(
        "deliverMessage",
        {
          message: messageField.value,
          friendNickname: (<Conversation>store.currentChat).other.nickname,
        },
        (msg: Message) => {
          store.currentChat?.messages?.push(msg);
        }
      );
    }
  }
  messageField.value = "";
};

const loadMoreMessages = () => {
  loadMore = true;
  if (isChannel(store.currentChat!)) {
    loadChannelMessages(<Channel>store.currentChat);
  } else {
    loadPrivateMessages(<Conversation>store.currentChat);
  }
};

const loadChannelMessages = async (channel: Channel): Promise<void> => {
  const data: Message[] = await fetchJSONDatas("api/chat/messages", "POST", {
    id: channel.id,
    skip: channel.messages?.length ? channel.messages?.length : 0,
  });
  store.currentChat!.messages = [...data, ...store.currentChat?.messages!];
};

const loadPrivateMessages = async (conv: Conversation): Promise<void> => {
  const offset: number = conv.messages?.length ? conv.messages?.length : 0;
  const data: Message[] = await fetchJSONDatas(`api/privateConv/getMessages/${conv.id}/${offset}`, "GET");
  store.currentChat!.messages = [...data, ...store.currentChat?.messages!];
};

window.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

store.$subscribe((mutation, state) => {
  socket = state.socket;
});

onUpdated(() => {
  if (loadMore === false) {
    scrollDownMessages("smooth");
  }
  loadMore = false;
});

onMounted(() => {
  scrollDownMessages("auto");
});
</script>
