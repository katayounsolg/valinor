import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth";
import { Prisma } from "@/app/generated/prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CreateGroupBody = {
  title?: unknown;
  slug?: unknown;
  sortOrder?: unknown;
  isActive?: unknown;
};

async function checkAdmin() {
  const user = await getCurrentUser();
  if (!user) return 401;
  if (user.role !== "ADMIN") return 403;
  return 200;
}

function denied(status: 401 | 403) {
  return NextResponse.json(
    {
      success: false,
      code: status === 401 ? "UNAUTHORIZED" : "FORBIDDEN",
      message: status === 401 ? "ابتدا وارد حساب مدیریت شوید." : "شما دسترسی مدیریت گروه‌ها را ندارید.",
    },
    { status }
  );
}

export async function GET() {
  try {
    const access = await checkAdmin();
    if (access !== 200) return denied(access);

    const groups = await prisma.objectGroup.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        sortOrder: true,
        isActive: true,
        _count: { select: { categories: true } },
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      { success: true, groups },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Admin object groups fetch failed:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_ERROR", message: "دریافت گروه‌ها انجام نشد." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const access = await checkAdmin();
    if (access !== 200) return denied(access);

    const body: unknown = await request.json().catch(() => null);

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, code: "INVALID_REQUEST", message: "اطلاعات ارسالی معتبر نیست." },
        { status: 400 }
      );
    }

    const input = body as CreateGroupBody;
    const title = typeof input.title === "string" ? input.title.trim() : "";
    const slug = typeof input.slug === "string" ? input.slug.trim() : "";
    const sortOrder = input.sortOrder === undefined ? 0 : input.sortOrder;
    const isActive = input.isActive === undefined ? true : input.isActive;

    if (title.length < 2 || title.length > 120) {
      return NextResponse.json(
        { success: false, code: "INVALID_TITLE", message: "عنوان گروه باید بین ۲ تا ۱۲۰ کاراکتر باشد." },
        { status: 400 }
      );
    }

    if (slug.length < 2 || slug.length > 120 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return NextResponse.json(
        { success: false, code: "INVALID_SLUG", message: "شناسه گروه باید فقط شامل حروف کوچک انگلیسی، عدد و خط تیره باشد." },
        { status: 400 }
      );
    }

    if (typeof sortOrder !== "number" || !Number.isSafeInteger(sortOrder) || sortOrder < -2147483648 || sortOrder > 2147483647) {
      return NextResponse.json(
        { success: false, code: "INVALID_SORT_ORDER", message: "ترتیب نمایش باید عدد صحیح معتبر باشد." },
        { status: 400 }
      );
    }

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { success: false, code: "INVALID_STATUS", message: "وضعیت نمایش گروه معتبر نیست." },
        { status: 400 }
      );
    }

    const group = await prisma.objectGroup.create({
      data: { title, slug, sortOrder, isActive },
      select: {
        id: true,
        slug: true,
        title: true,
        sortOrder: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { success: true, group },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { success: false, code: "SLUG_ALREADY_EXISTS", message: "این شناسه قبلاً برای گروه دیگری استفاده شده است." },
        { status: 409 }
      );
    }

    console.error("Admin object group creation failed:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_ERROR", message: "ایجاد گروه با خطا روبه‌رو شد." },
      { status: 500 }
    );
  }
}
