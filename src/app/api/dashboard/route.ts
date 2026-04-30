import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/route";
import { DONE_STATUS, IN_PROGRESS_STATUS } from "@/lib/types";

export async function GET() {
  const user = requireUser();
  if (user instanceof NextResponse) return user;

  const memberships = await prisma.projectMembership.findMany({
    where: { userId: user.id },
    select: { projectId: true },
  });

  const projectIds = memberships.map((m) => m.projectId);
  const now = new Date();

  const [total, done, overdue, inProgress] = await Promise.all([
    prisma.task.count({ where: { projectId: { in: projectIds } } }),
    prisma.task.count({ where: { projectId: { in: projectIds }, status: DONE_STATUS } }),
    prisma.task.count({
      where: {
        projectId: { in: projectIds },
        dueDate: { lt: now },
        status: { not: DONE_STATUS },
      },
    }),
    prisma.task.count({
      where: {
        projectId: { in: projectIds },
        status: IN_PROGRESS_STATUS,
      },
    }),
  ]);

  const tasksPerUserRaw = await prisma.task.groupBy({
    by: ["assigneeId"],
    where: { projectId: { in: projectIds } },
    _count: { _all: true },
  });

  const userIds = tasksPerUserRaw.map((entry) => entry.assigneeId).filter((id): id is string => Boolean(id));
  const users = userIds.length
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } })
    : [];

  return NextResponse.json({
    metrics: {
      totalTasks: total,
      completedTasks: done,
      overdueTasks: overdue,
      inProgressTasks: inProgress,
      tasksPerUser: tasksPerUserRaw
        .filter((entry) => entry.assigneeId)
        .map((entry) => {
          const assignedUser = users.find((u) => u.id === entry.assigneeId);
          return {
            userId: entry.assigneeId,
            name: assignedUser?.name || "Unknown",
            email: assignedUser?.email || "",
            taskCount: entry._count._all,
          };
        }),
    },
  });
}
