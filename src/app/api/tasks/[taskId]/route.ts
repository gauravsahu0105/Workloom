import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateTaskSchema } from "@/lib/validators";
import { hasProjectAccess, requireUser } from "@/lib/route";
import { ADMIN_ROLE } from "@/lib/types";

type Params = { params: { taskId: string } };

export async function PATCH(req: Request, { params }: Params) {
  const user = requireUser();
  if (user instanceof NextResponse) return user;

  const task = await prisma.task.findUnique({ where: { id: params.taskId } });
  if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });

  if (!(await hasProjectAccess(task.projectId, user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (user.role !== ADMIN_ROLE && task.assigneeId !== user.id) {
    return NextResponse.json({ error: "Members can only update assigned tasks." }, { status: 403 });
  }

  const parsed = updateTaskSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (user.role !== ADMIN_ROLE) {
    if (
      parsed.data.assigneeId !== undefined ||
      parsed.data.title !== undefined ||
      parsed.data.dueDate !== undefined ||
      parsed.data.priority !== undefined
    ) {
      return NextResponse.json({ error: "Members can only change status and description." }, { status: 403 });
    }
  }

  if (parsed.data.assigneeId) {
    const assigneeMembership = await prisma.projectMembership.findUnique({
      where: { projectId_userId: { projectId: task.projectId, userId: parsed.data.assigneeId } },
    });
    if (!assigneeMembership) {
      return NextResponse.json({ error: "Assignee must be a project member." }, { status: 400 });
    }
  }

  const updated = await prisma.task.update({
    where: { id: params.taskId },
    data: {
      status: parsed.data.status,
      assigneeId: parsed.data.assigneeId,
      priority: parsed.data.priority,
      title: parsed.data.title,
      description: parsed.data.description === null ? null : parsed.data.description,
      dueDate: parsed.data.dueDate === null ? null : parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
    },
  });

  return NextResponse.json({ task: updated });
}
