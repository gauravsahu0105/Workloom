import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasProjectAccess, requireRole, requireUser } from "@/lib/route";
import { ADMIN_ROLE } from "@/lib/types";

type Params = { params: { projectId: string; memberId: string } };

export async function DELETE(_: Request, { params }: Params) {
  const user = requireUser();
  if (user instanceof NextResponse) return user;
  const roleError = requireRole(user, ADMIN_ROLE);
  if (roleError) return roleError;

  if (!(await hasProjectAccess(params.projectId, user.id))) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const membership = await prisma.projectMembership.findUnique({
    where: { projectId_userId: { projectId: params.projectId, userId: params.memberId } },
  });

  if (!membership) {
    return NextResponse.json({ error: "Member is not part of this project." }, { status: 404 });
  }

  await prisma.projectMembership.delete({
    where: { projectId_userId: { projectId: params.projectId, userId: params.memberId } },
  });

  await prisma.task.updateMany({
    where: { projectId: params.projectId, assigneeId: params.memberId },
    data: { assigneeId: null },
  });

  return NextResponse.json({ ok: true });
}
