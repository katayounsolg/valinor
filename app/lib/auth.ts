import {
  createHash,
} from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/app/lib/prisma";

export function hashSessionToken(
  token: string
) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

export async function getCurrentUser() {
  const cookieStore =
    await cookies();

  const sessionToken =
    cookieStore.get(
      "valinor_session"
    )?.value;

  if (!sessionToken) {
    return null;
  }

  const storedToken =
    hashSessionToken(
      sessionToken
    );

  const session =
    await prisma.session.findUnique({
      where: {
        token: storedToken,
      },

      include: {
        user: true,
      },
    });

  if (!session) {
    return null;
  }

  if (
    session.expiresAt <=
    new Date()
  ) {
    /*
      Session منقضی شده.
      پاک‌سازی فیزیکی آن را در مرحله
      Session cleanup انجام می‌دهیم.
    */
    return null;
  }

  return session.user;
}

export async function requireUser() {
  const user =
    await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAdmin() {
  const user =
    await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (
    user.role !== "ADMIN"
  ) {
    redirect("/");
  }

  return user;
}