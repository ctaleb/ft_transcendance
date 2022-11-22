import { User } from "@/types/GameSummary";
import { defineStore } from "pinia";
import { Socket } from "socket.io-client";

interface State {
  user: User | undefined;
  invitations: User[] | undefined;
  socket: Socket | undefined;
  token: string | undefined;
}

export const useStore = defineStore("default", {
  state: (): State => {
    return {
      user: undefined,
      invitations: undefined,
      socket: undefined,
      token: undefined,
    };
  },
});
