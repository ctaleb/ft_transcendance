import { User } from "@/types/User";
import { Alert } from "@/types/GameSummary";
import { defineStore } from "pinia";
import { Socket } from "socket.io-client";
import { Conversation } from "@/types/Conversation";
import { Channel } from "@/types/Channel";

interface State {
  user: User | undefined;
  socket: Socket | undefined;
  message: Alert[];
  token: string | undefined;
  currentChat: Channel | Conversation | undefined;
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
