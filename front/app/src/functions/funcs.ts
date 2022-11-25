import config from "@/config/config";
import { useStore } from "@/store";
import { Alert } from "@/types/GameSummary";
import { User } from "@/types/User";
import { io } from "socket.io-client";

export async function isConnected(token: string): Promise<boolean> {
  console.log(token);
  if (token == "" || token == null) return false;
  let ret = await fetchJSONDatas("api/user/profile", "GET")
    .then(() => {
      return true;
    })
    .catch((err) => {
      return false;
    });
  return ret;
}

export function getUserAvatar(avatar: String): Promise<Blob> {
  return fetchBlobDatas(`api/user/profile-picture/${avatar}`, "GET");
}

async function fetchDatas(path: string, method: "GET" | "PUT" | "POST" | "DELETE", body?: object): Promise<any> {
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

export async function fetchJSONDatas(path: string, method: "GET" | "PUT" | "POST" | "DELETE"): Promise<any>;
export async function fetchJSONDatas(path: string, method: "GET" | "PUT" | "POST" | "DELETE", body: object): Promise<any>;
export async function fetchJSONDatas(path: string, method: "GET" | "PUT" | "POST" | "DELETE", body?: object): Promise<any> {
  return fetchDatas(path, method, body)
    .then((res: Response) => {
      if (!res.ok) return Promise.reject(res);
      return res.json();
    })
    .catch(async (err: Response) => {
      const message: string = await getErrorMessage(err);
      addAlertMessage(message, 3); // 3 is error
      return Promise.reject(message);
    });
}

export async function fetchBlobDatas(path: string, method: "GET" | "PUT" | "POST" | "DELETE"): Promise<any>;
export async function fetchBlobDatas(path: string, method: "GET" | "PUT" | "POST" | "DELETE", body: object): Promise<any>;
export async function fetchBlobDatas(path: string, method: "GET" | "PUT" | "POST" | "DELETE", body?: object): Promise<Blob> {
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

  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if (!token || !user) {
    return Promise.reject();
  }

  await fetchUser(token);
  connectSocket(token, JSON.parse(user));
  return Promise.resolve();
}

async function fetchUser(token: string): Promise<void> {
  const store = useStore();

  const response = await fetchJSONDatas("api/user/profile", "GET");
  store.user = response;
}

function connectSocket(token: string, user: any): void {
  const store = useStore();

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

export function addAlertMessage(message: string, type: number, second: number = 5) {
  const store = useStore();
  const x: Alert = {
    type: type,
    message: message,
    time: second,
  };
  store.message?.push(x);

  console.log(x);

  setTimeout(() => {
    store.message?.splice(store.message?.indexOf(x), 1);
  }, second * 1000);
}
