import { User } from "@/types/User";
import { Message } from "@/types/Message";

export interface Conversation {
  id: number;
  other: User;
  messages: Message[];
}

export namespace Conversation {
  export function getName(conv: Conversation): string {
    return User.getName(conv.other);
  }

  export function getAvatar(conv: Conversation): string {
    return User.getAvatar(conv.other);
  }
}
