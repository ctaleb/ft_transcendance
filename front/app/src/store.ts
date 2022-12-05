import { User } from "@/types/User";
import { Alert } from "@/types/GameSummary";
import { defineStore } from "pinia";
import { Socket } from "socket.io-client";
import { Conversation } from "@/types/Conversation";
import { Channel } from "@/types/Channel";
import { ShallowReactive, shallowReactive } from "vue";

export interface State {
  user?: User;
  socket?: Socket;
  message: Alert[];
  token?: string;
  currentChat?: Channel | Conversation;
}

export const useStore = defineStore("default", {
  state: (): State => {
    return {
      user: undefined,
      socket: undefined,
      message: [],
      token: undefined,
      currentChat: undefined,
    };
  },
});
