import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/app/lib/prisma";
import { hashSessionToken } from "@/app/lib/auth";

export const runtime = "nodejs";

function clearSessionCookie(
  response: NextResponse
) {
  response.cookies.set(
    "valinor_session",
    "",
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    }
  );

  response.headers.set(
    "Cache-Control",
    "no-store"
  );
}

export async function POST() {
  const cookieStore =
    await cookies();

  const sessionToken =
    cookieStore.get(
      "valinor_session"
    )?.value;

  try {
    if (sessionToken) {
      const storedToken =
        hashSessionToken(
          sessionToken
        );

      await prisma.session.deleteMany({
        where: {
          token: storedToken,
        },
      });
    }

    const response =
      NextResponse.json({
        success: true,
      });

    clearSessionCookie(response);

    return response;
  } catch (error) {
    console.error(
      "Logout failed:",
      error
    );

    /*
      حتی اگر حذف Session از DB
      با خطا روبه‌رو شود، Cookie
      مرورگر پاک می‌شود.
    */
    const response =
      NextResponse.json(
        {
          success: false,
          code: "LOGOUT_FAILED",
          message:
            "خروج از حساب با خطا روبه‌رو شد.",
        },
        {
          status: 500,
        }
      );

    clearSessionCookie(response);

    return response;
  }
}