import { fetchJSONDatas } from "@/functions/funcs";

export interface User {
  id: number;
  nickname: string;
  avatar: string;
  elo: number;
  status: string;
  twoFactorAuth?: boolean;
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

  export async function createConversation(other: User): Promise<void> {
    let data = await fetchJSONDatas(`api/privateConv/create/${other.id}`, "GET");
    console.log(data);
  }
}

export async function getUserByNickname(nickname: string): Promise<User> {
  return await fetchJSONDatas(`api/user/bynickname/${nickname}`, "GET");
}

export async function getUserById(id: number): Promise<User> {
  return await fetchJSONDatas(`api/user/${id}`, "GET");
}
