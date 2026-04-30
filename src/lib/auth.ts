import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { Role } from "./types";

const TOKEN_NAME = "workloom_token";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

type TokenPayload = SessionUser & {
  iat: number;
  exp: number;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function signToken(user: SessionUser) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
}

export function getTokenPayload(): SessionUser | null {
  const token = cookies().get(TOKEN_NAME)?.value;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export function setAuthCookie(token: string) {
  cookies().set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAuthCookie() {
  cookies().set(TOKEN_NAME, "", { httpOnly: true, expires: new Date(0), path: "/" });
}
