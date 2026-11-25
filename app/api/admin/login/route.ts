
import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";
import { hashSessionToken } from "@/app/lib/auth";
import { verifyAdminPassword } from "@/app/lib/admin-password";

export const runtime = "nodejs";

const SESSION_DURATION = 30 * 24 * 60 * 60;

function normalizePhone(value: string): string {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

  let phone = value
    .replace(/[۰-۹]/g, (digit) =>
      String(persianDigits.indexOf(digit))
    )
    .replace(/[٠-٩]/g, (digit) =>
      String(arabicDigits.indexOf(digit))
    )
    .replace(/\D/g, "");

  if (phone.startsWith("0098")) {
    phone = "0" + phone.slice(4);
  } else if (phone.startsWith("98")) {
    phone = "0" + phone.slice(2);
  } else if (phone.length === 10 && phone.startsWith("9")) {
    phone = "0" + phone;
  }

  return phone;
}

function isAllowedAdminPhone(phone: string): boolean {
  const allowedPhones = [
    process.env.ADMIN_PHONE_1,
    process.env.ADMIN_PHONE_2,
  ]
    .filter((value): value is string => Boolean(value))
    .map(normalizePhone);

  return allowedPhones.includes(phone);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const phone =
      typeof body.phone === "string"
        ? normalizePhone(body.phone)
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (
      !/^09\d{9}$/.test(phone) ||
      password.length < 1 ||
      password.length > 128
    ) {
      return NextResponse.json(
        { message: "شماره تلفن یا رمز عبور اشتباه است." },
        { status: 401 }
      );
    }

    if (!isAllowedAdminPhone(phone)) {
      return NextResponse.json(
        { message: "شماره تلفن یا رمز عبور اشتباه است." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { phone },
    });

    if (
      !user ||
      user.role !== "ADMIN" ||
      !user.passwordHash
    ) {
      return NextResponse.json(
        { message: "شماره تلفن یا رمز عبور اشتباه است." },
        { status: 401 }
      );
    }

    const passwordIsValid = await verifyAdminPassword(
      password,
      user.passwordHash
    );

    if (!passwordIsValid) {
      return NextResponse.json(
        { message: "شماره تلفن یا رمز عبور اشتباه است." },
        { status: 401 }
      );
    }

    const sessionToken = randomBytes(32).toString("base64url");
    const expiresAt = new Date(
      Date.now() + SESSION_DURATION * 1000
    );

    await prisma.session.create({
      data: {
        userId: user.id,
        token: hashSessionToken(sessionToken),
        expiresAt,
      },
    });

    const response = NextResponse.json(
      { success: true },
      { status: 200 }
    );

    response.cookies.set("valinor_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION,
    });

    response.headers.set("Cache-Control", "no-store");

    return response;
  } catch (error) {
    console.error("Admin login error:", error);

    return NextResponse.json(
      { message: "خطایی در ورود رخ داد. دوباره تلاش کنید." },
      { status: 500 }
    );
  }
}
