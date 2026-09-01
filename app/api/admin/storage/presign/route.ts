import {
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import {
  getSignedUrl,
} from "@aws-sdk/s3-request-presigner";

import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/app/lib/auth";

import {
  getStorageBucket,
  getStorageClient,
  getStoragePublicUrl,
} from "@/app/lib/storage";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE =
  8 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
} as const;

type AllowedImageType =
  keyof typeof ALLOWED_IMAGE_TYPES;

type UploadScope =
  | "categories"
  | "products";

type PresignBody = {
  fileType?: unknown;
  fileSize?: unknown;
  scope?: unknown;
};

function isAllowedImageType(
  value: string
): value is AllowedImageType {
  return value in ALLOWED_IMAGE_TYPES;
}

function isUploadScope(
  value: string
): value is UploadScope {
  return (
    value === "categories" ||
    value === "products"
  );
}

export async function POST(
  request: Request
) {
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
            "اجازه آپلود تصویر را ندارید.",
        },
        { status: 403 }
      );
    }

    const body = (await request
      .json()
      .catch(() => null)) as
      | PresignBody
      | null;

    if (!body) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_REQUEST",
          message:
            "اطلاعات فایل معتبر نیست.",
        },
        { status: 400 }
      );
    }

    const fileType =
      typeof body.fileType === "string"
        ? body.fileType.trim()
        : "";

    const fileSize =
      typeof body.fileSize === "number"
        ? body.fileSize
        : Number.NaN;

    const scope =
      typeof body.scope === "string"
        ? body.scope.trim()
        : "";

    if (
      !isAllowedImageType(fileType)
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_FILE_TYPE",
          message:
            "فقط تصاویر JPG، PNG، WEBP و AVIF مجاز هستند.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(fileSize) ||
      fileSize <= 0 ||
      fileSize > MAX_IMAGE_SIZE
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_FILE_SIZE",
          message:
            "حجم تصویر باید حداکثر ۸ مگابایت باشد.",
        },
        { status: 400 }
      );
    }

    if (!isUploadScope(scope)) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_UPLOAD_SCOPE",
          message:
            "محل ذخیره‌سازی تصویر معتبر نیست.",
        },
        { status: 400 }
      );
    }

    const now = new Date();

    const year =
      now.getUTCFullYear();

    const month = String(
      now.getUTCMonth() + 1
    ).padStart(2, "0");

    const extension =
      ALLOWED_IMAGE_TYPES[fileType];

    /*
      نام واقعی فایل کاربر را در Storage
      استفاده نمی‌کنیم.

      هر تصویر یک نام یکتا می‌گیرد تا
      تداخل فایل‌ها و مشکلات نام فایل
      به وجود نیاید.
    */
    const objectKey =
      `media/${scope}/${year}/${month}/` +
      `${randomUUID()}.${extension}`;

    const client =
      getStorageClient();

    const bucket =
      getStorageBucket();

    const command =
      new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        ContentType: fileType,
      });

    /*
      لینک PUT موقت فقط ۶۰ ثانیه
      اعتبار خواهد داشت.
    */
    const uploadUrl =
      await getSignedUrl(
        client,
        command,
        {
          expiresIn: 60,

          /*
            هنگام آپلود، مرورگر باید
            دقیقاً همین Content-Type
            را ارسال کند.
          */
          signableHeaders:
            new Set([
              "content-type",
            ]),
        }
      );

    /*
      آدرس عمومی تصویر را مستقل از
      Presigned URL می‌سازیم.

      در آینده اگر CDN یا دامنه اختصاصی
      رسانه اضافه شود، فقط لایه Storage
      تغییر خواهد کرد.
    */
    const publicUrl =
      getStoragePublicUrl(
        objectKey
      );

    return NextResponse.json(
      {
        success: true,

        upload: {
          uploadUrl,
          publicUrl,
          objectKey,
          contentType: fileType,
          expiresIn: 60,
        },
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
      "Storage presign failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code: "PRESIGN_FAILED",
        message:
          "ساخت مجوز آپلود تصویر با خطا روبه‌رو شد.",
      },
      { status: 500 }
    );
  }
}