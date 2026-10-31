import { SessionResponse, SessionUser } from "../types/session";
import { client } from "./client";

export const fetchSession = async (
  signal?: AbortSignal,
): Promise<SessionUser> => {
  const { data } = await client.get<SessionResponse>("/session", { signal });
  return data.user;
};

export const createSession = async (
  emailAddress: string,
  password: string,
): Promise<SessionUser> => {
  const { data } = await client.post<SessionResponse>("/session", {
    email_address: emailAddress,
    password,
  });

  return data.user;
};

export const destroySession = async (): Promise<void> => {
  await client.delete("session");
};
