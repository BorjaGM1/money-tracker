import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const AUTH_COOKIE_NAME = "auth-token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function verifyPassword(password: string): Promise<boolean> {
  const hashB64 = process.env.AUTH_PASSWORD_HASH_B64;
  if (!hashB64) {
    console.error("AUTH_PASSWORD_HASH_B64 not set");
    return false;
  }
  // Decode base64 to get the actual bcrypt hash
  // (base64 encoding avoids $ character being interpreted as env variable)
  const passwordHash = Buffer.from(hashB64, "base64").toString("utf-8");
  return bcrypt.compare(password, passwordHash);
}

export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  const expectedUsername = process.env.AUTH_USERNAME;
  if (!expectedUsername || username !== expectedUsername) {
    return false;
  }
  return verifyPassword(password);
}

export async function createSession(): Promise<void> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET not set");
  }

  // Simple token: timestamp + secret hash
  const timestamp = Date.now().toString();
  const token = Buffer.from(`${timestamp}:${secret}`).toString("base64");

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME);

  if (!token?.value) {
    return false;
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return false;
  }

  try {
    const decoded = Buffer.from(token.value, "base64").toString();
    const [, tokenSecret] = decoded.split(":");
    return tokenSecret === secret;
  } catch {
    return false;
  }
}

// Helper to hash a password (for generating AUTH_PASSWORD_HASH)
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}
