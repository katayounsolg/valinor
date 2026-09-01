"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  useState,
} from "react";

import ImageUploaderClient from "@/app/admin/components/ImageUploaderClient";
import styles from "./page.module.css";

export default function CategoryCreateFormClient() {
  const router = useRouter();

  const [title, setTitle] =
    useState("");

  const [slug, setSlug] =
    useState("");

  const [image, setImage] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const cleanTitle =
      title.trim();

    const cleanSlug =
      slug.trim();

    const cleanImage =
      image.trim();

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

      const response = await fetch(
        "/api/admin/categories",
        {
          method: "POST",

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
            "افزودن دسته‌بندی انجام نشد."
        );
        return;
      }

      router.push(
        `/admin/categories/${data.category.id}`
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Category creation failed:",
        error
      );

      setError(
        "ارتباط با سرور برقرار نشد. دوباره تلاش کنید."
      );
    } finally {
      setSubmitting(false);
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
              عنوان و آدرس دسته‌بندی را
              مشخص کنید.
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
                  className={styles.label}
                >
                  عنوان دسته‌بندی
                </span>

                <input
                  type="text"
                  className={
                    styles.input
                  }
                  value={title}
                  maxLength={120}
                  disabled={submitting}
                  onChange={(event) => {
                    setTitle(
                      event.target.value
                    );

                    if (error) {
                      setError("");
                    }
                  }}
                />
              </label>

              <label
                className={styles.field}
              >
                <span
                  className={styles.label}
                >
                  Slug
                </span>

                <input
                  type="text"
                  className={`${styles.input} ${styles.ltr}`}
                  value={slug}
                  maxLength={120}
                  spellCheck={false}
                  disabled={submitting}
                  placeholder="leather-bags"
                  onChange={(event) => {
                    setSlug(
                      event.target.value
                    );

                    if (error) {
                      setError("");
                    }
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
              disabled={submitting}
            >
              {submitting
                ? "در حال افزودن..."
                : "افزودن دسته‌بندی"}
            </button>
          </div>
        </article>

        {error && (
          <p className={styles.message}>
            {error}
          </p>
        )}
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
              تصویر مستقیماً در فضای ابری
              Valinor ذخیره می‌شود.
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
              disabled={submitting}
              onChange={(publicUrl) => {
                setImage(publicUrl);

                if (error) {
                  setError("");
                }
              }}
            />
          </div>
        </article>
      </aside>
    </form>
  );
}