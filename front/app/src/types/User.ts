import * as funcs from "@/functions/funcs";

// Inconsistent user structure, use the same throughout the application.
export interface User {
  id: number;
  nickname: string;
  avatar?: {
    path: string;
  };
  path?: string;
  image?: string;
}

export async function fetchUserAvatarURL(user: User): Promise<string> {
  return (user.image ??= URL.createObjectURL(
    await funcs.getUserAvatar(user.avatar?.path || user.path!)
  ));
}
