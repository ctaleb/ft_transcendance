import { addAlertMessage, fetchJSONDatas } from "@/functions/funcs";
import { socketLocal, useStore } from "@/store";
import { Channel, isChannel } from "@/types/Channel";
import { Conversation } from "@/types/Conversation";
import { Router } from "vue-router";

export interface User {
  id: number;
  nickname: string;
  avatar: string;
  elo: number;
  status: string;
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

  export async function createConversation(other: User): Promise<any> {
    const data = await fetchJSONDatas(`api/privateConv/create/${other.id}`, "GET").catch(() => {});
    return data;
  }

  export async function block(user?: User) {
    if (user) {
      return await fetchJSONDatas("api/friendship/block", "PUT", { addressee: user.nickname })
        .then(() => {
          addAlertMessage("The user has been blocked", 2);
          return true;
        })
        .catch(() => {
          return false;
        });
    }
  }

  export async function unfriend(user?: User) {
    if (user) {
      return await fetchJSONDatas("api/friendship/unfriend", "DELETE", { addressee: user.nickname })
        .then(() => {
          addAlertMessage("The user has been removed from friend list", 2);
          return true;
        })
        .catch(() => {
          return false;
        });
    }
  }

  export async function unblock(user?: User) {
    if (user) {
      return await fetchJSONDatas("api/friendship/unblock", "PUT", { addressee: user.nickname })
        .then(() => {
          addAlertMessage("The user has been unblocked", 2);
          return true;
        })
        .catch(() => {
          return false;
        });
    }
  }

  export function spectateGame(router: Router, user?: User) {
    if (user) {
      socketLocal.value?.emit("spectate", { friend: user.nickname }, (response: string) => {
        if (response == "inGame") {
          router.push("/game");
          socketLocal.value?.emit("readySpectate", { friend: user.nickname });
        }
      });
    }
  }

  export function inviteCustom(router: Router, user?: User) {
    if (user) {
      let accepted = "yes";
      socketLocal.value?.emit("customInvite", { friend: user.nickname }, (response: string) => {
        if (response != "accepted") {
          accepted = "no";
        }
      });
      if (accepted === "no") return;
      router.push("/game");
      socketLocal.value?.emit("settingsInviter", { friend: user.nickname });
    }
  }
}

export async function getUserByNickname(nickname: string): Promise<User> {
  return await fetchJSONDatas(`api/user/bynickname/${nickname}`, "GET");
}

export async function getUserById(id: number): Promise<User> {
  return await fetchJSONDatas(`api/user/${id}`, "GET");
}
