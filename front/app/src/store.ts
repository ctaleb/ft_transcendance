import { User } from "@/types/User";
import { Alert } from "@/types/GameSummary";
import { defineStore } from "pinia";
import { Socket } from "socket.io-client";
import { Conversation } from "@/types/Conversation";
import { Channel } from "@/types/Channel";
import { ref, shallowRef } from "vue";

interface State {
  user?: User;
  message: Alert[];
  token?: string;
  currentChat?: Channel | Conversation;
}

export const useStore = defineStore("default", {
  state: (): State => {
    return {
      user: undefined,
      message: [],
      token: undefined,
      currentChat: undefined,
    };
  },
});

export const socketLocal = shallowRef<Socket>();
export const currentUserProfile = ref<User>();
