import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const { name } = await req.json();

  if (!name) {
    return NextResponse.json(
      { success: false, message: "اسم وارد نشده است." },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("valinor_session")?.value;

  if (!sessionToken) {
    return NextResponse.json(
      { success: false, message: "کاربر وارد نشده است." },
      { status: 401 }
    );
  }

  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return NextResponse.json(
      { success: false, message: "نشست کاربر منقضی شده است." },
      { status: 401 }
    );
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: { name },
  });

  return NextResponse.json({
    success: true,
  });
}