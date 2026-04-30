import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addMemberSchema } from "@/lib/validators";
import { hasProjectAccess, requireRole, requireUser } from "@/lib/route";
import { ADMIN_ROLE } from "@/lib/types";

type Params = { params: { projectId: string } };

export async function GET(_: Request, { params }: Params) {
  const user = requireUser();
  if (user instanceof NextResponse) return user;

  if (!(await hasProjectAccess(params.projectId, user.id))) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const members = await prisma.projectMembership.findMany({
    where: { projectId: params.projectId },
    select: { user: { select: { id: true, name: true, email: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ members: members.map((m) => m.user) });
}

export async function POST(req: Request, { params }: Params) {
  const user = requireUser();
  if (user instanceof NextResponse) return user;
  const roleError = requireRole(user, ADMIN_ROLE);
  if (roleError) return roleError;

  if (!(await hasProjectAccess(params.projectId, user.id))) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const parsed = addMemberSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const member = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!member) return NextResponse.json({ error: "User does not exist." }, { status: 404 });

  await prisma.projectMembership.upsert({
    where: { projectId_userId: { projectId: params.projectId, userId: member.id } },
    update: {},
    create: { projectId: params.projectId, userId: member.id },
  });

  return NextResponse.json({ ok: true });
}
