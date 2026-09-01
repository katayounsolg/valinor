"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  useState,
} from "react";

import styles from "./page.module.css";

type Category = {
  id: number;
  title: string;
  slug: string;
};

type Product = {
  id: number;
  name: string;
  slug: string;
  price: number;
  stock: number;
  isAvailable: boolean;
  mainImage: string;
  categoryId: number;

  category: {
    id: number;
    title: string;
    slug: string;
  };
};

type Props = {
  product: Product;
  categories: Category[];
};

type FormData = {
  name: string;
  slug: string;
  categoryId: string;
  price: string;
  stock: string;
  mainImage: string;
  isAvailable: boolean;
};

export default function ProductEditFormClient({
  product,
  categories,
}: Props) {
  const router = useRouter();

  const [formData, setFormData] =
    useState<FormData>({
      name: product.name,
      slug: product.slug,
      categoryId: String(
        product.categoryId
      ),
      price: String(product.price),
      stock: String(product.stock),
      mainImage: product.mainImage,
      isAvailable:
        product.isAvailable,
    });

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

  const [deleteError, setDeleteError] =
    useState("");

  const busy =
    submitting || deleting;

  function updateField(
    field: keyof FormData,
    value: string | boolean
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    if (error) {
      setError("");
    }

    if (success) {
      setSuccess("");
    }

    if (deleteError) {
      setDeleteError("");
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (busy) {
      return;
    }

    const name =
      formData.name.trim();

    const slug =
      formData.slug.trim();

    const mainImage =
      formData.mainImage.trim();

    const categoryId = Number(
      formData.categoryId
    );

    const price = Number(
      formData.price
    );

    const stock = Number(
      formData.stock
    );

    if (
      name.length < 2 ||
      name.length > 160
    ) {
      setError(
        "نام محصول باید بین ۲ تا ۱۶۰ کاراکتر باشد."
      );
      return;
    }

    if (
      slug.length < 2 ||
      slug.length > 160 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
        slug
      )
    ) {
      setError(
        "Slug معتبر نیست. فقط حروف انگلیسی کوچک، عدد و خط تیره مجاز است."
      );
      return;
    }

    if (
      !Number.isInteger(categoryId) ||
      categoryId < 1
    ) {
      setError(
        "یک دسته‌بندی معتبر انتخاب کنید."
      );
      return;
    }

    if (
      !Number.isSafeInteger(price) ||
      price < 0
    ) {
      setError(
        "قیمت محصول معتبر نیست."
      );
      return;
    }

    if (
      !Number.isSafeInteger(stock) ||
      stock < 0
    ) {
      setError(
        "موجودی محصول معتبر نیست."
      );
      return;
    }

    if (!mainImage) {
      setError(
        "مسیر تصویر اصلی را وارد کنید."
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");
      setDeleteError("");

      const response = await fetch(
        `/api/admin/products/${product.id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            name,
            slug,
            categoryId,
            price,
            stock,
            mainImage,
            isAvailable:
              formData.isAvailable,
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

      setSuccess(
        "تغییرات محصول با موفقیت ذخیره شد."
      );

      setFormData({
        name: data.product.name,
        slug: data.product.slug,
        categoryId: String(
          data.product.categoryId
        ),
        price: String(
          data.product.price
        ),
        stock: String(
          data.product.stock
        ),
        mainImage:
          data.product.mainImage,
        isAvailable:
          data.product.isAvailable,
      });

      router.refresh();
    } catch (error) {
      console.error(
        "Product update failed:",
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
      setDeleteError("");
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/admin/products/${product.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!data) {
        setDeleteError(
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
        setDeleteError(
          data.message ||
            "حذف محصول انجام نشد."
        );
        return;
      }

      /*
        بعد از حذف، این صفحه دیگر وجود ندارد.
        به فهرست محصولات برمی‌گردیم.
      */
      router.replace("/admin/products");
      router.refresh();
    } catch (error) {
      console.error(
        "Product deletion failed:",
        error
      );

      setDeleteError(
        "ارتباط با سرور برقرار نشد. دوباره تلاش کنید."
      );
    } finally {
      setDeleting(false);
    }
  }

  const selectedCategory =
    categories.find(
      (category) =>
        category.id ===
        Number(
          formData.categoryId
        )
    );

  return (
    <form
      onSubmit={handleSubmit}
      className={styles.layout}
    >
      {/* MAIN */}
      <div className={styles.main}>
        {/* BASIC INFORMATION */}
        <article className={styles.panel}>
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
              اطلاعات اصلی
            </h2>

            <p
              className={
                styles.panelSub
              }
            >
              نام، شناسه فروشگاه و
              دسته‌بندی محصول
            </p>
          </header>

          <div
            className={styles.panelBody}
          >
            <div
              className={styles.gridTwo}
            >
              <label
                className={`${styles.field} ${styles.fieldFull}`}
              >
                <span
                  className={
                    styles.label
                  }
                >
                  نام محصول
                </span>

                <input
                  className={
                    styles.input
                  }
                  type="text"
                  value={formData.name}
                  maxLength={160}
                  disabled={busy}
                  onChange={(event) =>
                    updateField(
                      "name",
                      event.target.value
                    )
                  }
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
                  value={formData.slug}
                  maxLength={160}
                  spellCheck={false}
                  disabled={busy}
                  onChange={(event) =>
                    updateField(
                      "slug",
                      event.target.value
                    )
                  }
                />

                <p
                  className={styles.help}
                >
                  فقط حروف انگلیسی کوچک،
                  عدد و خط تیره.
                </p>
              </label>

              <label
                className={styles.field}
              >
                <span
                  className={
                    styles.label
                  }
                >
                  دسته‌بندی
                </span>

                <select
                  className={
                    styles.select
                  }
                  value={
                    formData.categoryId
                  }
                  disabled={busy}
                  onChange={(event) =>
                    updateField(
                      "categoryId",
                      event.target.value
                    )
                  }
                >
                  {categories.map(
                    (category) => (
                      <option
                        key={
                          category.id
                        }
                        value={
                          category.id
                        }
                      >
                        {
                          category.title
                        }
                      </option>
                    )
                  )}
                </select>
              </label>
            </div>
          </div>
        </article>

        {/* PRICE + STOCK */}
        <article className={styles.panel}>
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
              قیمت و موجودی
            </h2>

            <p
              className={
                styles.panelSub
              }
            >
              اطلاعاتی که مستقیماً
              روی خرید محصول اثر
              می‌گذارند
            </p>
          </header>

          <div
            className={styles.panelBody}
          >
            <div
              className={styles.gridTwo}
            >
              <label
                className={styles.field}
              >
                <span
                  className={
                    styles.label
                  }
                >
                  قیمت محصول — تومان
                </span>

                <input
                  className={`${styles.input} ${styles.ltr}`}
                  type="number"
                  min={0}
                  step={1}
                  value={formData.price}
                  disabled={busy}
                  onChange={(event) =>
                    updateField(
                      "price",
                      event.target.value
                    )
                  }
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
                  موجودی
                </span>

                <input
                  className={`${styles.input} ${styles.ltr}`}
                  type="number"
                  min={0}
                  step={1}
                  value={formData.stock}
                  disabled={busy}
                  onChange={(event) =>
                    updateField(
                      "stock",
                      event.target.value
                    )
                  }
                />
              </label>
            </div>
          </div>
        </article>

        {/* IMAGE */}
        <article className={styles.panel}>
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
              تصویر اصلی
            </h2>

            <p
              className={
                styles.panelSub
              }
            >
              مسیر تصویر اصلی محصول
              در فروشگاه
            </p>
          </header>

          <div
            className={styles.panelBody}
          >
            <label
              className={styles.field}
            >
              <span
                className={
                  styles.label
                }
              >
                مسیر تصویر
              </span>

              <input
                className={`${styles.input} ${styles.ltr}`}
                type="text"
                value={
                  formData.mainImage
                }
                spellCheck={false}
                disabled={busy}
                onChange={(event) =>
                  updateField(
                    "mainImage",
                    event.target.value
                  )
                }
              />
            </label>
          </div>
        </article>

        {/* AVAILABILITY */}
        <article className={styles.panel}>
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
              وضعیت فروشگاه
            </h2>

            <p
              className={
                styles.panelSub
              }
            >
              کنترل نمایش و امکان
              سفارش محصول
            </p>
          </header>

          <div
            className={styles.panelBody}
          >
            <label
              className={styles.field}
            >
              <span
                className={
                  styles.label
                }
              >
                وضعیت محصول
              </span>

              <select
                className={
                  styles.select
                }
                value={
                  formData.isAvailable
                    ? "available"
                    : "unavailable"
                }
                disabled={busy}
                onChange={(event) =>
                  updateField(
                    "isAvailable",
                    event.target.value ===
                      "available"
                  )
                }
              >
                <option value="available">
                  فعال در فروشگاه
                </option>

                <option value="unavailable">
                  غیرفعال
                </option>
              </select>

              <p
                className={styles.help}
              >
                محصول غیرفعال نباید
                امکان ثبت سفارش جدید
                داشته باشد.
              </p>
            </label>
          </div>
        </article>

        {/* RESULT */}
        {(error || success) && (
          <article
            className={styles.panel}
          >
            <div
              className={
                styles.panelBody
              }
            >
              <p
                className={
                  styles.description
                }
              >
                {error || success}
              </p>
            </div>
          </article>
        )}

        {/* SAVE ACTIONS */}
        <article className={styles.panel}>
          <div
            className={styles.actions}
          >
            <Link
              href="/admin/products"
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

        {/* DANGER ZONE */}
        <article className={styles.panel}>
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
              حذف محصول
            </h2>

            <p
              className={
                styles.panelSub
              }
            >
              این عملیات دائمی است
            </p>
          </header>

          <div
            className={styles.panelBody}
          >
            <div
              className={
                styles.dangerZone
              }
            >
              <h3
                className={
                  styles.dangerTitle
                }
              >
                حذف دائمی محصول
              </h3>

              <p
                className={
                  styles.dangerText
                }
              >
                با حذف این محصول، دیگر
                در پنل محصولات و فروشگاه
                وجود نخواهد داشت. اطلاعات
                snapshot سفارش‌های قدیمی
                باقی می‌ماند.
              </p>

              {deleteError && (
                <p
                  className={
                    styles.dangerText
                  }
                >
                  {deleteError}
                </p>
              )}

              {!deleteArmed ? (
                <button
                  type="button"
                  className={
                    styles.deleteButton
                  }
                  disabled={busy}
                  onClick={() => {
                    setDeleteArmed(true);
                    setDeleteError("");
                  }}
                >
                  حذف دائمی محصول
                </button>
              ) : (
                <div
                  className={
                    styles.deleteConfirm
                  }
                >
                  <p
                    className={
                      styles.deleteConfirmText
                    }
                  >
                    آیا مطمئن هستید که
                    می‌خواهید «
                    {product.name}» را
                    برای همیشه حذف کنید؟
                  </p>

                  <div
                    className={
                      styles.deleteConfirmActions
                    }
                  >
                    <button
                      type="button"
                      className={
                        styles.deleteConfirmButton
                      }
                      disabled={busy}
                      onClick={handleDelete}
                    >
                      {deleting
                        ? "در حال حذف..."
                        : "بله، حذف شود"}
                    </button>

                    <button
                      type="button"
                      className={
                        styles.deleteCancelButton
                      }
                      disabled={busy}
                      onClick={() => {
                        setDeleteArmed(false);
                        setDeleteError("");
                      }}
                    >
                      منصرف شدم
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </article>
      </div>

      {/* SIDE */}
      <aside className={styles.side}>
        {/* PREVIEW */}
        <article className={styles.panel}>
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
              پیش‌نمایش
            </h2>

            <p
              className={
                styles.panelSub
              }
            >
              تصویر فعلی فرم
            </p>
          </header>

          <div
            className={styles.panelBody}
          >
            <div
              className={
                styles.imagePreview
              }
            >
              {formData.mainImage ? (
                <img
                  src={
                    formData.mainImage
                  }
                  alt={formData.name}
                />
              ) : (
                <div
                  className={
                    styles.imageFallback
                  }
                >
                  V
                </div>
              )}
            </div>
          </div>
        </article>

        {/* CURRENT STATE */}
        <article className={styles.panel}>
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
              وضعیت محصول
            </h2>
          </header>

          <div
            className={styles.panelBody}
          >
            <div
              className={
                styles.statusBox
              }
            >
              <div
                className={
                  styles.statusRow
                }
              >
                <span
                  className={
                    styles.statusLabel
                  }
                >
                  نمایش
                </span>

                <strong
                  className={`${styles.statusValue} ${
                    formData.isAvailable
                      ? styles.available
                      : styles.unavailable
                  }`}
                >
                  {formData.isAvailable
                    ? "فعال"
                    : "غیرفعال"}
                </strong>
              </div>

              <div
                className={
                  styles.statusRow
                }
              >
                <span
                  className={
                    styles.statusLabel
                  }
                >
                  موجودی
                </span>

                <strong
                  className={
                    styles.statusValue
                  }
                >
                  {formData.stock || "۰"}
                </strong>
              </div>

              <div
                className={
                  styles.statusRow
                }
              >
                <span
                  className={
                    styles.statusLabel
                  }
                >
                  دسته‌بندی
                </span>

                <strong
                  className={
                    styles.statusValue
                  }
                >
                  {selectedCategory
                    ?.title || "—"}
                </strong>
              </div>
            </div>
          </div>
        </article>
      </aside>
    </form>
  );
}