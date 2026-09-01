import { S3Client } from "@aws-sdk/client-s3";

type StorageConfig = {
  endpoint: string;
  publicBaseUrl: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
};

let storageClient: S3Client | null = null;

function requireEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}`
    );
  }

  return value;
}

function normalizeUrl(value: string) {
  const url = value
    .trim()
    .replace(/\/+$/, "");

  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  return `https://${url}`;
}

export function getStorageConfig(): StorageConfig {
  const endpoint = normalizeUrl(
    requireEnv("S3_ENDPOINT")
  );

  return {
    endpoint,

    /*
      فعلاً در پارس‌پک دامنه پیش‌فرض عمومی
      همان آدرس سرویس است.

      بعداً اگر CDN یا media.valinor...
      داشته باشیم، فقط S3_PUBLIC_BASE_URL
      را در env تنظیم می‌کنیم.
    */
    publicBaseUrl: normalizeUrl(
      process.env.S3_PUBLIC_BASE_URL?.trim() ||
        endpoint
    ),

    bucket: requireEnv("S3_BUCKET"),

    accessKeyId: requireEnv(
      "S3_ACCESS_KEY_ID"
    ),

    secretAccessKey: requireEnv(
      "S3_SECRET_ACCESS_KEY"
    ),
  };
}

export function getStorageClient() {
  if (storageClient) {
    return storageClient;
  }

  const config = getStorageConfig();

  storageClient = new S3Client({
    region: "us-east-1",

    endpoint: config.endpoint,

    forcePathStyle: true,

    credentials: {
      accessKeyId: config.accessKeyId,

      secretAccessKey:
        config.secretAccessKey,
    },
  });

  return storageClient;
}

export function getStorageBucket() {
  return getStorageConfig().bucket;
}

export function getStoragePublicUrl(
  objectKey: string
) {
  const { publicBaseUrl } =
    getStorageConfig();

  const cleanKey = objectKey
    .split("/")
    .filter(Boolean)
    .map((part) =>
      encodeURIComponent(part)
    )
    .join("/");

  return `${publicBaseUrl}/${cleanKey}`;
}