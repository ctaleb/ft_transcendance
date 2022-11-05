import { reactive } from "vue";
import { User, History } from "@/types/GameSummary";

interface UserStore {
  friends: User[];
  invitations: User[];
  matchHistory: History[];
}

export const store = reactive<UserStore>({
  friends: [],
  invitations: [],
  matchHistory: [],
});
