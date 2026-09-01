import {
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

import { NextResponse } from "next/server";

import { getCurrentUser } from "@/app/lib/auth";

import {
  deleteMediaIfUnreferenced,
  isMediaUrlReferenced,
} from "@/app/lib/mediaCleanup";

import {
  getStorageBucket,
  getStorageClient,
  getStoragePublicUrl,
} from "@/app/lib/storage";

export const runtime = "nodejs";

const MEDIA_PREFIX = "media/";

/*
  فایل جدید را orphan حساب نمی‌کنیم.

  ممکن است ادمین تصویر را آپلود کرده
  ولی هنوز فرم محصول/دسته‌بندی را
  Save نکرده باشد.
*/
const MIN_ORPHAN_AGE_HOURS = 24;

type CleanupBody = {
  dryRun?: unknown;
};

export async function POST(
  request: Request
) {
  try {
    const user =
      await getCurrentUser();

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
            "اجازه پاک‌سازی فضای ذخیره‌سازی را ندارید.",
        },
        { status: 403 }
      );
    }

    const body = (await request
      .json()
      .catch(() => ({}))) as CleanupBody;

    /*
      حالت پیش‌فرض Dry Run است.

      یعنی اگر صراحتاً false نفرستیم،
      هیچ فایلی حذف نخواهد شد.
    */
    const dryRun =
      body.dryRun !== false;

    const client =
      getStorageClient();

    const bucket =
      getStorageBucket();

    const cutoff =
      Date.now() -
      MIN_ORPHAN_AGE_HOURS *
        60 *
        60 *
        1000;

    let continuationToken:
      | string
      | undefined;

    let scanned = 0;
    let recent = 0;
    let referenced = 0;
    let candidates = 0;
    let wouldDelete = 0;
    let deleted = 0;
    let failed = 0;

    do {
      const page =
        await client.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: MEDIA_PREFIX,
            MaxKeys: 1000,
            ContinuationToken:
              continuationToken,
          })
        );

      for (
        const object of
        page.Contents ?? []
      ) {
        const objectKey =
          object.Key;

        const lastModified =
          object.LastModified;

        if (
          !objectKey ||
          !lastModified
        ) {
          continue;
        }

        scanned += 1;

        /*
          فایل‌های کمتر از ۲۴ ساعت
          اصلاً بررسی نمی‌شوند.
        */
        if (
          lastModified.getTime() >
          cutoff
        ) {
          recent += 1;
          continue;
        }

        const publicUrl =
          getStoragePublicUrl(
            objectKey
          );

        candidates += 1;

        /*
          Dry Run:
          فقط بررسی می‌کنیم و چیزی
          از Storage حذف نمی‌شود.
        */
        if (dryRun) {
          try {
            const inUse =
              await isMediaUrlReferenced(
                publicUrl
              );

            if (inUse) {
              referenced += 1;
            } else {
              wouldDelete += 1;
            }
          } catch (error) {
            failed += 1;

            console.error(
              "Orphan dry-run check failed:",
              {
                objectKey,
                error,
              }
            );
          }

          continue;
        }

        /*
          حذف واقعی.

          این helper قبل از DeleteObject
          دوباره دیتابیس را بررسی می‌کند.
        */
        try {
          const result =
            await deleteMediaIfUnreferenced(
              publicUrl
            );

          if (result.deleted) {
            deleted += 1;
            continue;
          }

          if (
            result.reason ===
            "IN_USE"
          ) {
            referenced += 1;
          }
        } catch (error) {
          failed += 1;

          console.error(
            "Orphan cleanup failed:",
            {
              objectKey,
              error,
            }
          );
        }
      }

      continuationToken =
        page.IsTruncated
          ? page.NextContinuationToken
          : undefined;
    } while (continuationToken);

    return NextResponse.json(
      {
        success: true,

        cleanup: {
          dryRun,

          minimumAgeHours:
            MIN_ORPHAN_AGE_HOURS,

          scanned,
          recent,
          candidates,
          referenced,

          wouldDelete:
            dryRun
              ? wouldDelete
              : 0,

          deleted:
            dryRun
              ? 0
              : deleted,

          failed,
        },
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Storage orphan cleanup failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code:
          "ORPHAN_CLEANUP_FAILED",
        message:
          "پاک‌سازی فایل‌های بلااستفاده با خطا روبه‌رو شد.",
      },
      { status: 500 }
    );
  }
}