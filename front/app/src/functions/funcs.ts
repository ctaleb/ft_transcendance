import config from "@/config/config";
import { useStore } from "@/store";
import { User } from "@/types/User";
import { io } from "socket.io-client";

export async function isConnected(token: string): Promise<boolean> {
  if (token == null) return false;

  let ret: boolean = true;
  await fetch("http://" + window.location.hostname + ":3000/api/user/profile", {
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

export function getUserAvatar(avatar: String): Promise<Blob> {
  return fetchBlobDatas(`api/user/profile-picture/${avatar}`, "GET");
}

async function fetchDatas(
  path: string,
  method: "GET" | "PUT" | "POST" | "DELETE",
  body?: object
): Promise<any> {
  return fetch(`http://${window.location.hostname}:3000/${path}`, {
    method: method,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
    body: JSON.stringify(body),
  });
}

async function getErrorMessage(response: Response): Promise<string> {
  return await response
    .json()
    .then((d: { message: string }) => d.message)
    .catch((e: string) => e);
}

export async function fetchJSONDatas(
  path: string,
  method: "GET" | "PUT" | "POST" | "DELETE"
): Promise<any>;
export async function fetchJSONDatas(
  path: string,
  method: "GET" | "PUT" | "POST" | "DELETE",
  body: object
): Promise<any>;
export async function fetchJSONDatas(
  path: string,
  method: "GET" | "PUT" | "POST" | "DELETE",
  body?: object
): Promise<any> {
  return fetchDatas(path, method, body)
    .then((res: Response) => {
      if (!res.ok) return Promise.reject(res);
      return res.json();
    })
    .catch(async (err: Response) => {
      let message = await getErrorMessage(err);
      console.log(message);
      return Promise.reject(message);
    });
}

export async function fetchBlobDatas(
  path: string,
  method: "GET" | "PUT" | "POST" | "DELETE"
): Promise<any>;
export async function fetchBlobDatas(
  path: string,
  method: "GET" | "PUT" | "POST" | "DELETE",
  body: object
): Promise<any>;
export async function fetchBlobDatas(
  path: string,
  method: "GET" | "PUT" | "POST" | "DELETE",
  body?: object
): Promise<Blob> {
  return fetchDatas(path, method, body)
    .then((res: Response) => {
      if (!res.ok) return Promise.reject(res);
      return res.blob();
    })
    .catch(async (err: Response) => {
      let message = await getErrorMessage(err);
      console.log(message);
      return Promise.reject(message);
    });
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
  //  debugger;
  console.log("store socket: " + store.socket.id);
}
