"use client";

import {
  ChangeEvent,
  useRef,
  useState,
} from "react";

import {
  ImagePlus,
  Trash2,
} from "lucide-react";

import styles from "./ImageUploader.module.css";

type UploadScope =
  | "categories"
  | "products";

type Props = {
  value: string;
  scope: UploadScope;

  onChange: (
    publicUrl: string
  ) => void;

  disabled?: boolean;
};

type PresignResponse = {
  success?: boolean;

  message?: string;

  upload?: {
    uploadUrl: string;
    publicUrl: string;
    objectKey: string;
    contentType: string;
    expiresIn: number;
  };
};

const MAX_IMAGE_SIZE =
  8 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export default function ImageUploaderClient({
  value,
  scope,
  onChange,
  disabled = false,
}: Props) {
  const inputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [uploading, setUploading] =
    useState(false);

  const [progress, setProgress] =
    useState(0);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const busy =
    disabled || uploading;

  async function requestPresignedUrl(
    file: File
  ) {
    const response = await fetch(
      "/api/admin/storage/presign",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          fileType: file.type,
          fileSize: file.size,
          scope,
        }),
      }
    );

    const data = (await response
      .json()
      .catch(
        () => null
      )) as PresignResponse | null;

    if (response.status === 401) {
      window.location.href = "/login";

      throw new Error(
        "نشست کاربری منقضی شده است."
      );
    }

    if (
      !response.ok ||
      !data?.success ||
      !data.upload
    ) {
      throw new Error(
        data?.message ||
          "مجوز آپلود تصویر صادر نشد."
      );
    }

    return data.upload;
  }

  function uploadFile(
    file: File,
    uploadUrl: string
  ) {
    return new Promise<void>(
      (resolve, reject) => {
        const xhr =
          new XMLHttpRequest();

        xhr.open(
          "PUT",
          uploadUrl,
          true
        );

        /*
          این مقدار باید با Content-Type
          امضاشده در Presigned URL یکی باشد.
        */
        xhr.setRequestHeader(
          "Content-Type",
          file.type
        );

        xhr.upload.onprogress = (
          event
        ) => {
          if (!event.lengthComputable) {
            return;
          }

          const nextProgress =
            Math.round(
              (event.loaded /
                event.total) *
                100
            );

          setProgress(
            nextProgress
          );
        };

        xhr.onload = () => {
          if (
            xhr.status >= 200 &&
            xhr.status < 300
          ) {
            setProgress(100);
            resolve();
            return;
          }

          reject(
            new Error(
              `آپلود تصویر انجام نشد. کد پاسخ: ${xhr.status}`
            )
          );
        };

        xhr.onerror = () => {
          reject(
            new Error(
              "ارتباط مستقیم با فضای ذخیره‌سازی برقرار نشد."
            )
          );
        };

        xhr.onabort = () => {
          reject(
            new Error(
              "آپلود تصویر متوقف شد."
            )
          );
        };

        xhr.send(file);
      }
    );
  }

  async function handleFile(
    file: File
  ) {
    setError("");
    setSuccess("");
    setProgress(0);

    if (
      !ALLOWED_TYPES.has(
        file.type
      )
    ) {
      setError(
        "فقط تصاویر JPG، PNG، WEBP و AVIF مجاز هستند."
      );

      return;
    }

    if (
      file.size <= 0 ||
      file.size >
        MAX_IMAGE_SIZE
    ) {
      setError(
        "حجم تصویر باید حداکثر ۸ مگابایت باشد."
      );

      return;
    }

    try {
      setUploading(true);

      /*
        مرحله ۱:
        دریافت لینک موقت از سرور Valinor
      */
      const upload =
        await requestPresignedUrl(
          file
        );

      /*
        مرحله ۲:
        آپلود مستقیم مرورگر به Storage
      */
      await uploadFile(
        file,
        upload.uploadUrl
      );

      /*
        فقط URL عمومی داخل فرم ذخیره
        می‌شود؛ هیچ Credentialای وارد
        مرورگر یا دیتابیس نمی‌شود.
      */
      onChange(
        upload.publicUrl
      );

      setSuccess(
        "تصویر با موفقیت آپلود شد."
      );
    } catch (uploadError) {
      console.error(
        "Image upload failed:",
        uploadError
      );

      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "آپلود تصویر با خطا روبه‌رو شد."
      );
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value =
          "";
      }
    }
  }

  function handleInputChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    void handleFile(file);
  }

  function handleRemove() {
    if (busy) {
      return;
    }

    /*
      فعلاً فقط اتصال تصویر به فرم پاک
      می‌شود.

      حذف خود فایل از Storage را بعداً
      به API مدیریت Media اضافه می‌کنیم.
    */
    onChange("");

    setError("");
    setSuccess("");
    setProgress(0);
  }

  return (
    <div className={styles.uploader}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className={styles.fileInput}
        disabled={busy}
        onChange={
          handleInputChange
        }
      />

      {!value ? (
        <button
          type="button"
          className={`${styles.dropArea} ${
            busy
              ? styles.dropAreaDisabled
              : ""
          }`}
          disabled={busy}
          onClick={() => {
            inputRef.current?.click();
          }}
        >
          <span
            className={
              styles.content
            }
          >
            <span
              className={
                styles.icon
              }
            >
              <ImagePlus
                size={28}
                strokeWidth={1.2}
              />
            </span>

            <span
              className={
                styles.title
              }
            >
              {uploading
                ? "در حال آپلود تصویر..."
                : "انتخاب و آپلود تصویر"}
            </span>

            <span
              className={
                styles.description
              }
            >
              JPG، PNG، WEBP یا AVIF
              <br />
              حداکثر ۸ مگابایت
            </span>
          </span>
        </button>
      ) : (
        <div
          className={styles.preview}
        >
          <img
            src={value}
            alt="تصویر آپلودشده"
            className={
              styles.previewImage
            }
          />

          <button
            type="button"
            className={
              styles.removeButton
            }
            disabled={busy}
            onClick={handleRemove}
          >
            <Trash2
              size={13}
              strokeWidth={1.4}
            />

            {" "}
            حذف تصویر از فرم
          </button>
        </div>
      )}

      {uploading && (
        <p
          className={
            styles.progress
          }
        >
          آپلود: {progress}٪
        </p>
      )}

      {error && (
        <p
          className={styles.error}
        >
          {error}
        </p>
      )}

      {success && (
        <p
          className={
            styles.success
          }
        >
          {success}
        </p>
      )}
    </div>
  );
}