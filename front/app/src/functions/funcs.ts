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

export function getUserById(id: number): Promise<any> {
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

export function getUserAvatar(avatar: String): Promise<void | Blob> {
  return fetch(
    "http://" +
      window.location.hostname +
      ":3000/api/user/profile-picture/" +
      avatar,
    {
      method: "GET",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    }
  )
    .then((res) => {
      return res.blob();
    })
    .catch((err) => console.log(err.message));
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
  return fetch(`http://${window.location.hostname}:3000/${path}`, {
    method: method,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
    body: JSON.stringify(body),
  })
    .then((res: Response) => {
      if (!res.ok) return Promise.reject(res);
      return res.json();
    })
    .catch((err: Response) => {
      let message: string;
      err
        .json()
        .then((d: { message: string }) => {
          message = d.message;
        })
        .catch((e: any) => (message = e))
        .finally(() => {
          console.log(message);
        });
    });
}
