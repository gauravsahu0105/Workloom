import { NextResponse } from "next/server";
import { setAuthCookie, signToken, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/types";
import { loginSchema } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const sessionUser = { id: user.id, email: user.email, name: user.name, role: user.role as Role };
    setAuthCookie(signToken(sessionUser));

    return NextResponse.json({ user: sessionUser });
  } catch {
    return NextResponse.json({ error: "Could not log in." }, { status: 500 });
  }
}
