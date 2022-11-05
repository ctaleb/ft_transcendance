import { User } from "@/types/GameSummary";

export function isConnected(token: string): boolean {
  if (token == null) return false;

  let ret: boolean = true;
  fetch("http://" + window.location.hostname + ":3000/api/user/profile", {
    method: "GET",
    headers: {
      Authorization: "Bearer " + token,
    },
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.message) ret = false;
    })
    .catch((err) => console.log(err.message));
  return ret;
}

export function getUserById(id: number): Promise<User | undefined> {
  return fetch("http://" + window.location.hostname + ":3000/api/user/" + id, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  })
    .then((res) => {
      return res.json();
    })
    .catch((err) => console.log(err.message));
}

export function getUserByNickname(name: string): Promise<User | undefined> {
  return fetch(
    "http://" + window.location.hostname + ":3000/api/user/bynickname/" + name,
    {
      method: "GET",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    }
  )
    .then((res) => {
      return res.json();
    })
    .catch((err) => console.log(err.message));
}

export function getUserAvatar(avatar: String): string {
  return `http://${window.location.hostname}:3000/api/user/profile-picture/${avatar}`;
}
