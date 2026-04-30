import { NextResponse } from "next/server";
import { getTokenPayload, SessionUser } from "./auth";
import { prisma } from "./prisma";
import { Role } from "./types";

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbiddenResponse() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export function requireUser(): SessionUser | NextResponse {
  const user = getTokenPayload();
  if (!user) return unauthorizedResponse();
  return user;
}

export function requireRole(user: SessionUser, role: Role): NextResponse | null {
  if (user.role !== role) return forbiddenResponse();
  return null;
}

export async function hasProjectAccess(projectId: string, userId: string) {
  const membership = await prisma.projectMembership.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  return Boolean(membership);
}
