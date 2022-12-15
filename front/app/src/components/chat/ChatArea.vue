<template>
  <div class="chat-area">
    <div class="chat-messages">
      <button v-if="!disableLoadMore" class="button" @click="loadMoreMessages()">Load more</button>
      <template v-for="(message, index) in store.currentChat?.messages">
        <div v-if="store.user?.nickname === message.author" class="msg-out">
          <div class="chat-message chat-message-out">
            <h4>{{ message.author }}</h4>
            <p>{{ message.text }}</p>
            <p class="date">{{ message.date }}</p>
          </div>
          <img
            v-if="index < 1 || store.currentChat?.messages![index - 1].author != message.author"
            class="user-image"
            :src="User.getAvatar(store.user)"
            alt=""
          />
          <img v-else class="user-image" :src="User.getAvatar(store.user)" alt="" style="z-index: -1000" />
        </div>
        <div v-else class="msg-in">
          <img
            v-if="index < 1 || store.currentChat?.messages![index - 1].author != message.author"
            class="user-image"
            :src="message.author != 'UNKNOWN' ? User.getAvatarByNickname(message.author, store.currentChat!) : defaultAvatarUrl"
            alt=""
          />
          <img
            v-else
            style="z-index: -1000"
            class="user-image"
            :src="message.author != 'UNKNOWN' ? User.getAvatarByNickname(message.author, store.currentChat!) : defaultAvatarUrl"
            alt=""
          />
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
      <input type="text" class="input" name="messageField" v-model="messageField" placeholder="Write your message" maxlength="2000" />
      <button class="button pulse" @click="sendMessage()"><img src="../../assets/sendIcon.svg" alt="" /></button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { addAlertMessage, fetchJSONDatas } from "@/functions/funcs";
import { socketLocal, useStore } from "@/store";
import { Channel, isChannel } from "@/types/Channel";
import { Conversation } from "@/types/Conversation";
import { Message, transformDate } from "@/types/Message";
import { User } from "@/types/User";
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import defaultAvatarUrl from "../../assets/defaultAvatar.png";

const defaultAvatarImg = new Image();
defaultAvatarImg.src = defaultAvatarUrl;

const store = useStore();

let currentChannelId = store.currentChat?.id;

const messageField = ref("");
const blockScroll = ref(false);
const disableLoadMore = ref(false);
const messagesBoxRef = ref<HTMLDivElement | null>(null);

const scrollDownMessages = (behavior: ScrollBehavior | undefined) => {
  if (!blockScroll.value) {
    nextTick(() => {
      messagesBoxRef.value?.scrollIntoView({ behavior, block: "end" });
    });
  }
};

const sendMessage = () => {
  messageField.value = messageField.value.trim();
  if (messageField.value.length > 0) {
    if (isChannel(store.currentChat!)) {
      socketLocal.value?.emit(
        "sendChannelMessage",
        {
          channelId: store.currentChat!.id,
          channelName: (<Channel>store.currentChat)?.name,
          content: messageField.value,
        },
        (error: string) => {
          if (error.length > 0) {
            addAlertMessage(`${error}`, 1);
          }
        }
      );
    } else {
      socketLocal.value?.emit(
        "deliverMessage",
        {
          message: messageField.value,
          friendNickname: (<Conversation>store.currentChat).other.nickname,
        },
        (msg: any) => {
          if (msg.blocked) {
            addAlertMessage(msg.message, 3);
          } else {
            store.currentChat?.messages?.push(transformDate(msg));
          }
        }
      );
    }
  }
  messageField.value = "";
};

const loadMoreMessages = () => {
  blockScroll.value = true;
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
  if (data.length === 0) {
    disableLoadMore.value = true;
    return;
  }
  for (let i = 0; i < data.length; i++) data[i] = transformDate(data[i]);
  store.$patch({
    currentChat: {
      messages: [...data, ...store.currentChat?.messages!],
    },
  });
};

const loadPrivateMessages = async (conv: Conversation): Promise<void> => {
  const offset: number = conv.messages?.length ? conv.messages?.length : 0;
  const data: Message[] = await fetchJSONDatas(`api/privateConv/getMessages/${conv.id}/${offset}`, "GET");
  if (data.length === 0) {
    disableLoadMore.value = true;
    return;
  }
  for (let i = 0; i < data.length; i++) data[i] = transformDate(data[i]);
  store.$patch({
    currentChat: {
      messages: [...data, ...store.currentChat?.messages!],
    },
  });
};

window.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

store.$subscribe((mutation, state) => {
  if (currentChannelId != state.currentChat?.id) {
    scrollDownMessages("auto");
  } else {
    scrollDownMessages("smooth");
  }
  blockScroll.value = false;
  currentChannelId = state.currentChat?.id;
});

onMounted(() => {
  scrollDownMessages("auto");
  if (store.currentChat && store.currentChat!.messages && store.currentChat!.messages!.length < 20) disableLoadMore.value = true;
  watch(
    () => store.currentChat?.id,
    () => {
      disableLoadMore.value = false;
      if (store.currentChat && store.currentChat!.messages && store.currentChat!.messages!.length < 20) disableLoadMore.value = true;
    }
  );
  if (socketLocal.value) {
    socketLocal.value?.on("updateChannelMembers", async (channelId: number) => {
      if (store.currentChat && isChannel(store.currentChat) && channelId === store.currentChat.id) {
        await fetchJSONDatas("api/chat/members", "POST", {
          id: store.currentChat!.id,
        })
          .then((data) => {
            store.currentChat?.messages?.forEach((msg) => {
              if (!data.find((member: any) => member.nickname === msg.author)) msg.author = "UNKNOWN";
            });
            store.$patch({
              currentChat: { members: data },
            });
          })
          .catch(() => {});
      }
    });
  }
  watch(
    () => socketLocal.value,
    () => {
      socketLocal.value?.removeListener("updateChannelMembers");
      socketLocal.value?.on("updateChannelMembers", async (channelId: number) => {
        if (store.currentChat && isChannel(store.currentChat) && channelId === store.currentChat.id) {
          await fetchJSONDatas("api/chat/members", "POST", {
            id: store.currentChat!.id,
          })
            .then((data) => {
              store.currentChat?.messages?.forEach((msg) => {
                if (!data.find((member: any) => member.nickname === msg.author)) msg.author = "UNKNOWN";
              });
              store.$patch({
                currentChat: { members: data },
              });
            })
            .catch(() => {});
        }
      });
    }
  );
});

onUnmounted(() => {
  socketLocal.value?.removeListener("updateChannelMembers");
  messageField.value = "";
});
</script>
