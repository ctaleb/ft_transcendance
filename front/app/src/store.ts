import { User } from "@/types/User";
import { Alert } from "@/types/GameSummary";
import { defineStore } from "pinia";
import { Socket } from "socket.io-client";

interface State {
  user: User | undefined;
  invitations: User[] | undefined;
  socket: Socket | undefined;
  message: Alert[];
}

export const useStore = defineStore("default", {
  state: (): State => {
    return {
      user: undefined,
      invitations: undefined,
      socket: undefined,
      message: [],
    };
  },
});
