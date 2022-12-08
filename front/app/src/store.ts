import { User } from "@/types/User";
import { Alert } from "@/types/GameSummary";
import { defineStore } from "pinia";
import { Socket } from "socket.io-client";
import { Conversation } from "@/types/Conversation";
import { Channel, ChannelUser } from "@/types/Channel";
import { ref, shallowRef } from "vue";

interface State {
  user?: User;
  message: Alert[];
  token?: string;
  currentChat?: Channel | Conversation;
}

export interface Menu {
  requester?: ChannelUser;
  user?: User | ChannelUser;
  top: number;
  left: number;
  view: boolean;
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
export const privateConvs = ref<Conversation[]>([]);

export const menu = ref<Menu>({
  requester: undefined,
  user: undefined,
  top: 0,
  left: 0,
  view: false,
});
