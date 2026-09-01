import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("valinor_session")?.value;

  if (!sessionToken) {
    return NextResponse.json({ user: null });
  }

  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      name: session.user.name,
      phone: session.user.phone,
    },
  });
}