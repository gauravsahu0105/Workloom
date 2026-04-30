import { NextResponse } from "next/server";
import { createProjectSchema } from "@/lib/validators";
import { prisma } from "@/lib/prisma";
import { requireRole, requireUser } from "@/lib/route";
import { ADMIN_ROLE } from "@/lib/types";

export async function GET() {
  const user = requireUser();
  if (user instanceof NextResponse) return user;

  const projects = await prisma.project.findMany({
    where: {
      memberships: { some: { userId: user.id } },
    },
    include: {
      _count: { select: { tasks: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ projects });
}

export async function POST(req: Request) {
  const user = requireUser();
  if (user instanceof NextResponse) return user;
  const roleError = requireRole(user, ADMIN_ROLE);
  if (roleError) return roleError;

  const parsed = createProjectSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      createdById: user.id,
      memberships: { create: { userId: user.id } },
    },
  });

  return NextResponse.json({ project }, { status: 201 });
}
