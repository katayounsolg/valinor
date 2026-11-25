import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const groups = await prisma.objectGroup.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "asc" },
      ],
      select: {
        id: true,
        slug: true,
        title: true,
        sortOrder: true,
        categories: {
          orderBy: {
            createdAt: "asc",
          },
          select: {
            slug: true,
            title: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        groups,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Public object groups fetch failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "دریافت گروه‌های محصولات با خطا مواجه شد.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
