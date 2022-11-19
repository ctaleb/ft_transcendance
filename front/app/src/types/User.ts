import { fetchJSONDatas } from "@/functions/funcs";
import { Pictured } from "@/types/Utils";

export class User implements Pictured {
  id!: number;
  nickname!: string;
  avatar!: string;
  friends?: User[];
  invitations?: User[];
  history?: History[];

  getPicture(): string {
    return this.avatar;
  }
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
