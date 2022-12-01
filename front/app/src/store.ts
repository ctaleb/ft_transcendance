import { User } from "@/types/User";
import { Alert } from "@/types/GameSummary";
import { defineStore } from "pinia";
import { Socket } from "socket.io-client";
import { Conversation } from "@/types/Conversation";
import { Channel } from "@/types/Channel";
import { ref, ShallowReactive, shallowReactive } from "vue";

export interface State {
  user?: User;
  socket?: Socket;
  message: Alert[];
  token?: string;
  currentChat?: Channel | Conversation;
}

export interface Menu {
  user?: User;
  top: number;
  left: number;
  view: boolean;
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

export const menu = ref<Menu>({
  user: undefined,
  top: 0,
  left: 0,
  view: false,
});
