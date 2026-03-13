import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { SessionPayload } from "@/types";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-secret-replace-in-production-32chars"
);

const ALGORITHM = "HS256";
const EXPIRY = "8h";

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as JWTPayload & SessionPayload;
  } catch {
    return null;
  }
}
