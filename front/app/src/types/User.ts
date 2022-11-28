import { fetchJSONDatas } from "@/functions/funcs";
import { Channel, isChannel } from "@/types/Channel";
import { Conversation } from "@/types/Conversation";
import { storeToRefs } from "pinia";

export interface User {
  id: number;
  nickname: string;
  avatar: string;
  elo: number;
  twoFactorAuth?: boolean;
  phone?: string;
  friends?: User[];
  invitations?: User[];
  history?: History[];
}

export namespace User {
  export function getName(user: User): string {
    return user.nickname;
  }

  export function getAvatar(user: User): string {
    return `http://${window.location.hostname}:3000${user.avatar}`;
  }

  export function getAvatarByNickname(nickname: string, chatEntity: Channel | Conversation): string {
    let avatar;
    if (isChannel(chatEntity)) {
      avatar = (<Channel>chatEntity).members?.find((el) => el.nickname === nickname)?.avatar;
    } else {
      avatar = (<Conversation>chatEntity).other.avatar;
    }
    return `http://${window.location.hostname}:3000${avatar}`;
  }

  export async function createConversation(other: User): Promise<void> {
    let data = await fetchJSONDatas(`api/privateConv/create/${other.id}`, "GET");
    return data;
  }
}

export async function getUserByNickname(nickname: string): Promise<User> {
  return await fetchJSONDatas(`api/user/bynickname/${nickname}`, "GET");
}

export async function getUserById(id: number): Promise<User> {
  return await fetchJSONDatas(`api/user/${id}`, "GET");
}
