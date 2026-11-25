"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import ImageUploaderClient from "@/app/admin/components/ImageUploaderClient";
import styles from "./page.module.css";

type ObjectGroup = {
  id: number;
  title: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
};

type GroupsResponse = {
  success?: boolean;
  groups?: ObjectGroup[];
  message?: string;
};

type CreateCategoryResponse = {
  success?: boolean;
  message?: string;
  category?: { id: number };
};

export default function CategoryCreateFormClient() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [image, setImage] = useState("");
  const [objectGroupId, setObjectGroupId] = useState("");
  const [groups, setGroups] = useState<ObjectGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [groupsError, setGroupsError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadGroups() {
      setGroupsLoading(true);
      setGroupsError("");

      try {
        const response = await fetch("/api/admin/object-groups", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (response.status === 401) {
          router.replace("/admin-login");
          return;
        }

        const data = (await response.json().catch(() => null)) as GroupsResponse | null;

        if (!response.ok || !data?.success || !Array.isArray(data.groups)) {
          throw new Error(data?.message || "دریافت گروه‌های محصولات انجام نشد.");
        }

        const activeGroups = data.groups
          .filter(
            (group) =>
              Number.isSafeInteger(group.id) &&
              group.id > 0 &&
              typeof group.title === "string" &&
              group.isActive === true
          )
          .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);

        if (!controller.signal.aborted) {
          setGroups(activeGroups);
          setObjectGroupId((current) =>
            activeGroups.some((group) => String(group.id) === current)
              ? current
              : ""
          );
        }
      } catch (cause) {
        if (controller.signal.aborted) return;

        setGroupsError(
          cause instanceof Error
            ? cause.message
            : "خطا در دریافت گروه‌های محصولات."
        );
      } finally {
        if (!controller.signal.aborted) {
          setGroupsLoading(false);
        }
      }
    }

    void loadGroups();

    return () => controller.abort();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) return;

    const cleanTitle = title.trim();
    const cleanSlug = slug.trim();
    const cleanImage = image.trim();
    const selectedGroupId = Number(objectGroupId);

    if (cleanTitle.length < 2 || cleanTitle.length > 120) {
      setError("عنوان دسته‌بندی باید بین ۲ تا ۱۲۰ کاراکتر باشد.");
      return;
    }

    if (
      cleanSlug.length < 2 ||
      cleanSlug.length > 120 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleanSlug)
    ) {
      setError("Slug معتبر نیست. فقط حروف انگلیسی کوچک، عدد و خط تیره مجاز است.");
      return;
    }

    if (!objectGroupId || !groups.some((group) => group.id === selectedGroupId)) {
      setError("لطفاً گروه اصلی دسته‌بندی را انتخاب کنید.");
      return;
    }

    if (!cleanImage) {
      setError("ابتدا تصویر دسته‌بندی را آپلود کنید.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cleanTitle,
          slug: cleanSlug,
          image: cleanImage,
          objectGroupId: selectedGroupId,
        }),
      });

      if (response.status === 401) {
        router.replace("/admin-login");
        return;
      }

      const data = (await response.json().catch(() => null)) as CreateCategoryResponse | null;

      if (!data) {
        setError("پاسخ نامعتبر از سرور دریافت شد.");
        return;
      }

      if (!response.ok || !data.success || !data.category?.id) {
        setError(data.message || "افزودن دسته‌بندی انجام نشد.");
        return;
      }

      router.push(`/admin/categories/${data.category.id}`);
      router.refresh();
    } catch (cause) {
      console.error("Category creation failed:", cause);
      setError("ارتباط با سرور برقرار نشد. دوباره تلاش کنید.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.formGrid} onSubmit={handleSubmit}>
      <div className={styles.main}>
        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>اطلاعات دسته‌بندی</h2>
            <p className={styles.panelSub}>
              عنوان، آدرس و گروه اصلی دسته‌بندی را مشخص کنید.
            </p>
          </header>

          <div className={styles.panelBody}>
            <div className={styles.fields}>
              <label className={styles.field}>
                <span className={styles.label}>عنوان دسته‌بندی</span>
                <input
                  type="text"
                  className={styles.input}
                  value={title}
                  maxLength={120}
                  disabled={submitting}
                  required
                  onChange={(event) => {
                    setTitle(event.target.value);
                    setError("");
                  }}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Slug</span>
                <input
                  type="text"
                  className={`${styles.input} ${styles.ltr}`}
                  value={slug}
                  maxLength={120}
                  spellCheck={false}
                  disabled={submitting}
                  placeholder="leather-bags"
                  required
                  onChange={(event) => {
                    setSlug(event.target.value);
                    setError("");
                  }}
                />
                <p className={styles.help}>
                  فقط حروف انگلیسی کوچک، عدد و خط تیره.
                </p>
              </label>

              <label className={styles.field}>
                <span className={styles.label}>گروه اصلی در صفحه Objects</span>
                <select
                  className={styles.input}
                  value={objectGroupId}
                  disabled={submitting || groupsLoading || !!groupsError || groups.length === 0}
                  required
                  onChange={(event) => {
                    setObjectGroupId(event.target.value);
                    setError("");
                  }}
                >
                  <option value="">
                    {groupsLoading ? "در حال دریافت گروه‌ها..." : "انتخاب گروه"}
                  </option>
                  {groups.map((group) => (
                    <option value={group.id} key={group.id}>
                      {group.title}
                    </option>
                  ))}
                </select>
                <p className={styles.help}>
                  این دسته‌بندی فقط در تب گروه انتخاب‌شده نمایش داده می‌شود.
                </p>
              </label>

              {groupsError && (
                <p className={styles.message} role="alert">
                  {groupsError}
                </p>
              )}
              {!groupsLoading && !groupsError && groups.length === 0 && (
                <p className={styles.help}>
                  هیچ گروه فعالی پیدا نشد. ابتدا از بخش «گروه‌های محصولات» یک گروه فعال بسازید.
                </p>
              )}
            </div>
          </div>

          <div className={styles.actions}>
            <Link href="/admin/categories" className={styles.cancelLink}>
              انصراف
            </Link>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={submitting || groupsLoading || !!groupsError || groups.length === 0}
            >
              {submitting ? "در حال افزودن..." : "افزودن دسته‌بندی"}
            </button>
          </div>
        </article>

        {error && <p className={styles.message} role="alert">{error}</p>}
      </div>

      <aside className={styles.side}>
        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>تصویر دسته‌بندی</h2>
            <p className={styles.panelSub}>
              تصویر مستقیماً در فضای ابری Valinor ذخیره می‌شود.
            </p>
          </header>
          <div className={styles.panelBody}>
            <ImageUploaderClient
              value={image}
              scope="categories"
              disabled={submitting}
              onChange={(publicUrl) => {
                setImage(publicUrl);
                setError("");
              }}
            />
          </div>
        </article>
      </aside>
    </form>
  );
}
