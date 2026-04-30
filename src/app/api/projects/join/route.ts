import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/route";
import { joinProjectSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const user = requireUser();
  if (user instanceof NextResponse) return user;

  const parsed = joinProjectSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const project = await prisma.project.findUnique({ where: { id: parsed.data.projectId } });
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  await prisma.projectMembership.upsert({
    where: { projectId_userId: { projectId: project.id, userId: user.id } },
    update: {},
    create: { projectId: project.id, userId: user.id },
  });

  return NextResponse.json({ ok: true });
}
