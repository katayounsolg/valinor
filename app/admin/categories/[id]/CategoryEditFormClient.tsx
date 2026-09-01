"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  useState,
} from "react";

import ImageUploaderClient from "@/app/admin/components/ImageUploaderClient";
import styles from "../new/page.module.css";

type Category = {
  id: number;
  title: string;
  slug: string;
  image: string;
  productCount: number;
};

type Props = {
  category: Category;
};

export default function CategoryEditFormClient({
  category,
}: Props) {
  const router = useRouter();

  const [title, setTitle] =
    useState(category.title);

  const [slug, setSlug] =
    useState(category.slug);

  const [image, setImage] =
    useState(category.image);

  const [submitting, setSubmitting] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [deleteArmed, setDeleteArmed] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const busy = submitting || deleting;

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (busy) {
      return;
    }

    const cleanTitle = title.trim();
    const cleanSlug = slug.trim();
    const cleanImage = image.trim();

    if (
      cleanTitle.length < 2 ||
      cleanTitle.length > 120
    ) {
      setError(
        "عنوان دسته‌بندی باید بین ۲ تا ۱۲۰ کاراکتر باشد."
      );
      return;
    }

    if (
      cleanSlug.length < 2 ||
      cleanSlug.length > 120 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
        cleanSlug
      )
    ) {
      setError(
        "Slug معتبر نیست. فقط حروف انگلیسی کوچک، عدد و خط تیره مجاز است."
      );
      return;
    }

    if (!cleanImage) {
      setError(
        "ابتدا تصویر دسته‌بندی را آپلود کنید."
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/admin/categories/${category.id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            title: cleanTitle,
            slug: cleanSlug,
            image: cleanImage,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!data) {
        setError(
          "پاسخ نامعتبر از سرور دریافت شد."
        );
        return;
      }

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (
        !response.ok ||
        !data.success
      ) {
        setError(
          data.message ||
            "ذخیره تغییرات انجام نشد."
        );
        return;
      }

      setTitle(
        data.category.title
      );

      setSlug(
        data.category.slug
      );

      setImage(
        data.category.image
      );

      setSuccess(
        "تغییرات دسته‌بندی با موفقیت ذخیره شد."
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Category update failed:",
        error
      );

      setError(
        "ارتباط با سرور برقرار نشد. دوباره تلاش کنید."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (busy) {
      return;
    }

    try {
      setDeleting(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/admin/categories/${category.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!data) {
        setError(
          "پاسخ نامعتبر از سرور دریافت شد."
        );
        return;
      }

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (
        !response.ok ||
        !data.success
      ) {
        setError(
          data.message ||
            "حذف دسته‌بندی انجام نشد."
        );
        return;
      }

      router.replace(
        "/admin/categories"
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Category deletion failed:",
        error
      );

      setError(
        "ارتباط با سرور برقرار نشد. دوباره تلاش کنید."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form
      className={styles.formGrid}
      onSubmit={handleSubmit}
    >
      <div className={styles.main}>
        <article
          className={styles.panel}
        >
          <header
            className={
              styles.panelHeader
            }
          >
            <h2
              className={
                styles.panelTitle
              }
            >
              اطلاعات دسته‌بندی
            </h2>

            <p
              className={
                styles.panelSub
              }
            >
              عنوان و Slug دسته‌بندی را
              مدیریت کنید.
            </p>
          </header>

          <div
            className={
              styles.panelBody
            }
          >
            <div
              className={styles.fields}
            >
              <label
                className={styles.field}
              >
                <span
                  className={
                    styles.label
                  }
                >
                  عنوان دسته‌بندی
                </span>

                <input
                  className={
                    styles.input
                  }
                  type="text"
                  value={title}
                  maxLength={120}
                  disabled={busy}
                  onChange={(event) => {
                    setTitle(
                      event.target.value
                    );

                    setError("");
                    setSuccess("");
                  }}
                />
              </label>

              <label
                className={styles.field}
              >
                <span
                  className={
                    styles.label
                  }
                >
                  Slug
                </span>

                <input
                  className={`${styles.input} ${styles.ltr}`}
                  type="text"
                  value={slug}
                  maxLength={120}
                  spellCheck={false}
                  disabled={busy}
                  onChange={(event) => {
                    setSlug(
                      event.target.value
                    );

                    setError("");
                    setSuccess("");
                  }}
                />

                <p
                  className={styles.help}
                >
                  فقط حروف انگلیسی کوچک،
                  عدد و خط تیره.
                </p>
              </label>
            </div>
          </div>

          <div
            className={styles.actions}
          >
            <Link
              href="/admin/categories"
              className={
                styles.cancelLink
              }
            >
              انصراف
            </Link>

            <button
              type="submit"
              className={
                styles.saveButton
              }
              disabled={busy}
            >
              {submitting
                ? "در حال ذخیره..."
                : "ذخیره تغییرات"}
            </button>
          </div>
        </article>

        {error && (
          <p className={styles.message}>
            {error}
          </p>
        )}

        {success && (
          <p className={styles.message}>
            {success}
          </p>
        )}

        <article
          className={styles.panel}
        >
          <header
            className={
              styles.panelHeader
            }
          >
            <h2
              className={
                styles.panelTitle
              }
            >
              حذف دسته‌بندی
            </h2>

            <p
              className={
                styles.panelSub
              }
            >
              این عملیات دائمی است.
            </p>
          </header>

          <div
            className={
              styles.panelBody
            }
          >
            {category.productCount >
            0 ? (
              <p
                className={
                  styles.message
                }
              >
                این دسته‌بندی{" "}
                {category.productCount}{" "}
                محصول دارد و تا زمانی که
                محصولات آن را به
                دسته‌بندی دیگری منتقل
                نکنی، قابل حذف نیست.
              </p>
            ) : !deleteArmed ? (
              <button
                type="button"
                className={
                  styles.saveButton
                }
                disabled={busy}
                onClick={() => {
                  setDeleteArmed(true);
                  setError("");
                  setSuccess("");
                }}
              >
                حذف دائمی دسته‌بندی
              </button>
            ) : (
              <div
                className={
                  styles.fields
                }
              >
                <p
                  className={
                    styles.help
                  }
                >
                  آیا مطمئن هستی که
                  می‌خواهی «
                  {category.title}» را
                  برای همیشه حذف کنی؟
                </p>

                <div
                  className={
                    styles.actions
                  }
                >
                  <button
                    type="button"
                    className={
                      styles.cancelLink
                    }
                    disabled={busy}
                    onClick={() =>
                      setDeleteArmed(
                        false
                      )
                    }
                  >
                    منصرف شدم
                  </button>

                  <button
                    type="button"
                    className={
                      styles.saveButton
                    }
                    disabled={busy}
                    onClick={
                      handleDelete
                    }
                  >
                    {deleting
                      ? "در حال حذف..."
                      : "بله، حذف شود"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </article>
      </div>

      <aside className={styles.side}>
        <article
          className={styles.panel}
        >
          <header
            className={
              styles.panelHeader
            }
          >
            <h2
              className={
                styles.panelTitle
              }
            >
              تصویر دسته‌بندی
            </h2>

            <p
              className={
                styles.panelSub
              }
            >
              برای تعویض تصویر، تصویر
              فعلی را از فرم حذف و تصویر
              جدید را آپلود کنید.
            </p>
          </header>

          <div
            className={
              styles.panelBody
            }
          >
            <ImageUploaderClient
              value={image}
              scope="categories"
              disabled={busy}
              onChange={(
                publicUrl
              ) => {
                setImage(publicUrl);
                setError("");
                setSuccess("");
              }}
            />
          </div>
        </article>
      </aside>
    </form>
  );
}