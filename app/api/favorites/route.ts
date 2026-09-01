import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: Request) {
  try {
    const { productId } = await req.json();
    const productIdNumber = Number(productId);

    if (!productIdNumber) {
      return NextResponse.json(
        { success: false, message: "محصول نامعتبر است." },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("valinor_session")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, message: "ابتدا وارد حساب شوید." },
        { status: 401 }
      );
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: "نشست کاربر معتبر نیست." },
        { status: 401 }
      );
    }

    const existing = await prisma.$queryRaw<
      { id: number }[]
    >`
      SELECT id FROM Favorite
      WHERE userId = ${session.userId}
      AND productId = ${productIdNumber}
      LIMIT 1
    `;

    if (existing.length > 0) {
      await prisma.$executeRaw`
        DELETE FROM Favorite
        WHERE id = ${existing[0].id}
      `;

      return NextResponse.json({
        success: true,
        favorite: false,
      });
    }

    await prisma.$executeRaw`
      INSERT INTO Favorite (userId, productId, createdAt)
      VALUES (${session.userId}, ${productIdNumber}, ${new Date()})
    `;

    return NextResponse.json({
      success: true,
      favorite: true,
    });
  } catch (error) {
    console.error("FAVORITE ERROR:", error);

    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
}