import { fetchJSONDatas } from "@/functions/funcs";

export interface User {
  id: number;
  nickname: string;
  avatar: string;
  friends?: User[];
  invitations?: User[];
  history?: History[];
}

export function getUserAvatar(user: User): string {
  return `http://${window.location.hostname}:3000${user.avatar}`;
}

export async function getUserByNickname(nickname: string): Promise<User> {
  return await fetchJSONDatas(`api/user/bynickname/${nickname}`, "GET");
}

export async function getUserById(id: number): Promise<User> {
  return await fetchJSONDatas(`api/user/${id}`, "GET");
}
