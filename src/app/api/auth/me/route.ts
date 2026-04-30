import { NextResponse } from "next/server";
import { requireUser } from "@/lib/route";

export async function GET() {
  const user = requireUser();
  if (user instanceof NextResponse) return user;
  return NextResponse.json({ user });
}
