import { User } from "@/types/GameSummary";
import { defineStore } from "pinia";

interface State {
  user: User | undefined;
  invitations: User[];
}

export const useStore = defineStore("default", {
  state: (): State => {
    return {
      user: undefined,
      invitations: [],
    };
  },
});
