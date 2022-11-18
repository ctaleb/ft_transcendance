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
  return await response.json()
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
