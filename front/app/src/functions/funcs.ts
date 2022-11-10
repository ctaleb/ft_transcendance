import config from "@/config/config";
import { useStore } from "@/store";
import { User } from "@/types/GameSummary";
import { io } from "socket.io-client";

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

export function getUserAvatar(user: User | undefined): string {
  if (!user) {
    return "";
  }

  return `http://${window.location.hostname}:3000${user.avatar}`;
}

export async function trySetupUser(): Promise<void> {
  if (config.socket.id) {
    return Promise.resolve();
  }

  let token = localStorage.getItem("token");
  let user = localStorage.getItem("user");

  if (!token || !user) {
    return Promise.reject();
  }

  await fetchUser(token);
  connectSocket(token, JSON.parse(user));

  return Promise.resolve();
}

async function fetchUser(token: string): Promise<void> {
  const store = useStore();

  let response = await fetch(
    `http://${window.location.hostname}:3000/api/user/profile`,
    {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
      },
    }
  );
  if (!response.ok) {
    return Promise.reject();
  }

  let data = await response.json();
  store.user = data;

  let res = await fetch(
    `http://${window.location.hostname}:3000/api/friendship`,
    {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
      },
    }
  );
  if (!res.ok) {
    return Promise.reject();
  }
  const resTyped: { friends: User[]; invitations: User[] } =
    (await res.json()) as { friends: User[]; invitations: User[] };
  store.invitations = resTyped.invitations;
}

function connectSocket(token: string, user: any): void {
  const store = useStore();

  console.log(store.user);
  store.socket = io("http://" + window.location.hostname + ":3500", {
    auth: { token: token, user: user },
    transports: ["websocket"],
  });
  //  config.socket = io("http://" + window.location.hostname + ":3500", {
  //    auth: { token: token, user: user },
  //    transports: ["websocket"],
  //  });
  console.log(store.socket);
  debugger;
  console.log("store socket: " + store.socket.id);
}
