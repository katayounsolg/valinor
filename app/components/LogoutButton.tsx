"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      style={{
        width: "100%",
        height: "58px",
        borderRadius: "18px",
        border: "none",
        background: "#f6f1ee",
        cursor: "pointer",
        fontSize: "17px",
      }}
    >
      🚪 خروج از حساب
    </button>
  );
}