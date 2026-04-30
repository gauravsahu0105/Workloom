import { NextResponse } from "next/server";
import { hashPassword, setAuthCookie, signToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ADMIN_ROLE, Role } from "@/lib/types";
import { signupSchema } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) {
      return NextResponse.json({ error: "Email is already registered." }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash: await hashPassword(parsed.data.password),
        role: parsed.data.role,
      },
    });

    if (user.role === ADMIN_ROLE) {
      await prisma.project.create({
        data: {
          name: `${user.name}'s Team`,
          description: "Default project created on admin signup.",
          createdById: user.id,
          memberships: { create: { userId: user.id } },
        },
      });
    }

    const sessionUser = { id: user.id, email: user.email, name: user.name, role: user.role as Role };
    setAuthCookie(signToken(sessionUser));

    return NextResponse.json({ user: sessionUser }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create account." }, { status: 500 });
  }
}
