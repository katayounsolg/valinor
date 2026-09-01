import {
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

import { prisma } from "@/app/lib/prisma";

import {
  getStorageBucket,
  getStorageClient,
  getStorageConfig,
} from "@/app/lib/storage";

export type MediaCleanupResult =
  | {
      deleted: true;
      reason: "DELETED";
      objectKey: string;
    }
  | {
      deleted: false;
      reason:
        | "EMPTY_URL"
        | "NOT_MANAGED_MEDIA"
        | "IN_USE";
      objectKey?: string;
    };

function normalizeBaseUrl(
  value: string
) {
  return new URL(
    value.replace(/\/+$/, "") + "/"
  );
}

function extractKeyFromBase(
  publicUrl: string,
  baseUrl: string
) {
  try {
    const target =
      new URL(publicUrl);

    const base =
      normalizeBaseUrl(baseUrl);

    /*
      فایل فقط وقتی متعلق به Storage ماست
      که origin با یکی از URLهای Storage
      خودمان یکی باشد.
    */
    if (
      target.origin !== base.origin
    ) {
      return null;
    }

    const basePath =
      base.pathname.replace(
        /\/+$/,
        ""
      );

    const targetPath =
      target.pathname;

    let encodedKey = "";

    if (
      !basePath ||
      basePath === "/"
    ) {
      encodedKey =
        targetPath.replace(
          /^\/+/,
          ""
        );
    } else {
      if (
        !targetPath.startsWith(
          `${basePath}/`
        )
      ) {
        return null;
      }

      encodedKey =
        targetPath
          .slice(
            basePath.length
          )
          .replace(
            /^\/+/,
            ""
          );
    }

    if (!encodedKey) {
      return null;
    }

    const key = encodedKey
      .split("/")
      .map((part) =>
        decodeURIComponent(
          part
        )
      )
      .join("/");

    /*
      Valinor فقط اجازه حذف فایل‌هایی را
      می‌دهد که خودش داخل media/
      ایجاد کرده باشد.

      حتی اگر URL دیگری روی همان Storage
      وجود داشته باشد، این helper آن را
      حذف نمی‌کند.
    */
    if (
      !key.startsWith("media/")
    ) {
      return null;
    }

    const segments =
      key.split("/");

    if (
      segments.some(
        (segment) =>
          !segment ||
          segment === "." ||
          segment === ".."
      )
    ) {
      return null;
    }

    return key;
  } catch {
    return null;
  }
}

export function getManagedMediaObjectKey(
  publicUrl: string
) {
  const cleanUrl =
    publicUrl.trim();

  if (!cleanUrl) {
    return null;
  }

  const config =
    getStorageConfig();

  /*
    هر دو آدرس را قبول می‌کنیم:

    1. publicBaseUrl
    2. endpoint

    این باعث می‌شود اگر بعداً CDN یا
    دامنه اختصاصی اضافه شد، تصاویر
    قدیمی Storage هم قابل شناسایی باشند.
  */
  const possibleBases =
    Array.from(
      new Set([
        config.publicBaseUrl,
        config.endpoint,
      ])
    );

  for (
    const baseUrl of
    possibleBases
  ) {
    const objectKey =
      extractKeyFromBase(
        cleanUrl,
        baseUrl
      );

    if (objectKey) {
      return objectKey;
    }
  }

  return null;
}

function parseGalleryImages(
  value: string
) {
  try {
    const parsed =
      JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (
        item
      ): item is string =>
        typeof item ===
        "string"
    );
  } catch {
    return null;
  }
}

export async function isMediaUrlReferenced(
  publicUrl: string
) {
  const cleanUrl =
    publicUrl.trim();

  if (!cleanUrl) {
    return false;
  }

  /*
    ابتدا referenceهای ساده و مستقیم.
  */
  const [
    categoryReference,
    mainImageReference,
    galleryCandidates,
  ] = await Promise.all([
    prisma.category.findFirst({
      where: {
        image: cleanUrl,
      },

      select: {
        id: true,
      },
    }),

    prisma.product.findFirst({
      where: {
        mainImage:
          cleanUrl,
      },

      select: {
        id: true,
      },
    }),

    /*
      images در schema فعلی String است
      و JSON داخلش ذخیره شده.

      contains فقط کاندیدها را کم می‌کند؛
      پایین‌تر تطبیق دقیق انجام می‌شود.
    */
    prisma.product.findMany({
      where: {
        images: {
          contains:
            cleanUrl,
        },
      },

      select: {
        id: true,
        images: true,
      },
    }),
  ]);

  if (
    categoryReference ||
    mainImageReference
  ) {
    return true;
  }

  for (
    const product of
    galleryCandidates
  ) {
    const images =
      parseGalleryImages(
        product.images
      );

    /*
      اگر JSON خراب باشد ولی query
      نشان داده URL داخل متن وجود دارد،
      محافظه‌کارانه فایل را in-use
      حساب می‌کنیم و حذف نمی‌کنیم.
    */
    if (images === null) {
      return true;
    }

    if (
      images.includes(
        cleanUrl
      )
    ) {
      return true;
    }
  }

  return false;
}

export async function deleteMediaIfUnreferenced(
  publicUrl: string
): Promise<MediaCleanupResult> {
  const cleanUrl =
    publicUrl.trim();

  if (!cleanUrl) {
    return {
      deleted: false,
      reason: "EMPTY_URL",
    };
  }

  const objectKey =
    getManagedMediaObjectKey(
      cleanUrl
    );

  if (!objectKey) {
    /*
      فایل خارجی یا تصاویر قدیمی local
      هرگز توسط این helper حذف نمی‌شوند.
    */
    return {
      deleted: false,
      reason:
        "NOT_MANAGED_MEDIA",
    };
  }

  const referenced =
    await isMediaUrlReferenced(
      cleanUrl
    );

  if (referenced) {
    return {
      deleted: false,
      reason: "IN_USE",
      objectKey,
    };
  }

  const client =
    getStorageClient();

  const bucket =
    getStorageBucket();

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: objectKey,
    })
  );

  return {
    deleted: true,
    reason: "DELETED",
    objectKey,
  };
}