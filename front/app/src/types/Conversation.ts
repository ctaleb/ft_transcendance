import { User } from "@/types/User";
import { Message } from "@/types/Message";

export interface Conversation {
  messages: Message[];
  uuid: string;
  other: User;
  notif: boolean;
}

export namespace Conversation {
  export function getName(conv: Conversation): string {
    // TODO Change to other
    return User.getName(conv.other);
  }

  export function getAvatar(conv: Conversation): string {
    // TODO Change to other
    return User.getAvatar(conv.other);
  }
}
