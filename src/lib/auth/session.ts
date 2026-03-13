import { cookies } from "next/headers";
import { verifyToken } from "./jwt";
import type { SessionPayload } from "@/types";

export const SESSION_COOKIE = "auth_session";

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  return verifyToken(token);
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();

  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  return session;
}
