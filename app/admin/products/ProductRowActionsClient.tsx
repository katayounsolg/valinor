"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import styles from "./page.module.css";

type Props = {
  productId: number;
  productName: string;
};

export default function ProductRowActionsClient({
  productId,
  productName,
}: Props) {
  const router = useRouter();

  const [deleteArmed, setDeleteArmed] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleDelete() {
    if (deleting) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      const response = await fetch(
        `/api/admin/products/${productId}`,
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
            "حذف محصول انجام نشد."
        );
        return;
      }

      setDeleteArmed(false);

      router.refresh();
    } catch (error) {
      console.error(
        "Product deletion failed:",
        error
      );

      setError(
        "ارتباط با سرور برقرار نشد."
      );
    } finally {
      setDeleting(false);
    }
  }

  if (deleteArmed) {
    return (
      <div className={styles.deleteConfirm}>
        <button
          type="button"
          className={
            styles.deleteConfirmButton
          }
          disabled={deleting}
          onClick={handleDelete}
          title={`حذف دائمی ${productName}`}
        >
          {deleting
            ? "در حال حذف..."
            : "تأیید حذف"}
        </button>

        <button
          type="button"
          className={
            styles.deleteCancelButton
          }
          disabled={deleting}
          onClick={() => {
            setDeleteArmed(false);
            setError("");
          }}
        >
          انصراف
        </button>

        {error && (
          <span>
            {error}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={styles.rowActions}>
      <Link
        href={`/admin/products/${productId}`}
        className={styles.actionLink}
      >
        ویرایش
      </Link>

      <button
        type="button"
        className={styles.deleteAction}
        onClick={() => {
          setDeleteArmed(true);
          setError("");
        }}
      >
        حذف
      </button>
    </div>
  );
}