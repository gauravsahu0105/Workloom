import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTaskSchema } from "@/lib/validators";
import { hasProjectAccess, requireRole, requireUser } from "@/lib/route";
import { ADMIN_ROLE } from "@/lib/types";

type Params = { params: { projectId: string } };

export async function GET(_: Request, { params }: Params) {
  const user = requireUser();
  if (user instanceof NextResponse) return user;

  if (!(await hasProjectAccess(params.projectId, user.id))) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const tasks = await prisma.task.findMany({
    where: {
      projectId: params.projectId,
      ...(user.role === ADMIN_ROLE ? {} : { assigneeId: user.id }),
    },
    include: { assignee: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ tasks });
}

export async function POST(req: Request, { params }: Params) {
  const user = requireUser();
  if (user instanceof NextResponse) return user;
  const roleError = requireRole(user, ADMIN_ROLE);
  if (roleError) return roleError;

  if (!(await hasProjectAccess(params.projectId, user.id))) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const parsed = createTaskSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.assigneeId) {
    const assigneeMembership = await prisma.projectMembership.findUnique({
      where: { projectId_userId: { projectId: params.projectId, userId: parsed.data.assigneeId } },
    });
    if (!assigneeMembership) {
      return NextResponse.json({ error: "Assignee must be a project member." }, { status: 400 });
    }
  }

  const task = await prisma.task.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      assigneeId: parsed.data.assigneeId || null,
      priority: parsed.data.priority || "MEDIUM",
      projectId: params.projectId,
    },
    include: { assignee: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({ task }, { status: 201 });
}
