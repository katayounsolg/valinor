import {
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/app/lib/auth";
import {
  getStorageBucket,
  getStorageClient,
} from "@/app/lib/storage";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          code: "UNAUTHORIZED",
          message:
            "برای انجام این عملیات باید وارد حساب کاربری شوید.",
        },
        { status: 401 }
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          code: "FORBIDDEN",
          message:
            "اجازه بررسی فضای ذخیره‌سازی را ندارید.",
        },
        { status: 403 }
      );
    }

    const client = getStorageClient();
    const bucket = getStorageBucket();

    await client.send(
      new HeadBucketCommand({
        Bucket: bucket,
      })
    );

    return NextResponse.json(
      {
        success: true,
        message:
          "اتصال به فضای ذخیره‌سازی با موفقیت برقرار شد.",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Storage connection test failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code: "STORAGE_CONNECTION_FAILED",
        message:
          "اتصال به فضای ذخیره‌سازی برقرار نشد.",
      },
      { status: 500 }
    );
  }
}