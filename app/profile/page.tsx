import Link from "next/link";
import LogoutButton from "@/app/components/LogoutButton";
import Header from "@/app/components/Header";
import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  Home,
  ShoppingBag,
  Package,
  Heart,
  Settings,
  MapPin,
} from "lucide-react";
import styles from "./page.module.css";

export default async function ProfilePage() {
  const cookieStore = await cookies();

  const sessionToken = cookieStore.get("valinor_session")?.value;

  if (!sessionToken) {
    redirect("/login");
  }

  const session = await prisma.session.findUnique({
    where: {
      token: sessionToken,
    },
    include: {
      user: true,
    },
  });

  if (!session || session.expiresAt < new Date()) {
    redirect("/login");
  }

  const userName = session.user.name || "کاربر والینور";

  return (
    <main className={styles.page}>
      <Header />

      <section className={styles.accountHeader} dir="rtl">
        <p className={styles.eyebrow}>ACCOUNT</p>

        <div className={styles.userBox}>
          <div className={styles.avatar}></div>

          <div>
            <h1>
              {userName}
            </h1>

            <p>
              مدیریت سفارش‌ها، علاقه‌مندی‌ها و اطلاعات حساب
            </p>

            <span>
              {session.user.phone}
            </span>
          </div>
        </div>
      </section>


      <section className={styles.menu} dir="rtl">

        <ProfileCard
          href="/"
          title="صفحه اصلی"
          icon={<Home size={25} strokeWidth={1.2} />}
        />


        <ProfileCard
          href="/cart"
          title="سبد خرید"
          icon={<ShoppingBag size={25} strokeWidth={1.2} />}
        />


        <ProfileCard
          href="/profile/orders"
          title="سفارش‌های من"
          icon={<Package size={25} strokeWidth={1.2} />}
        />


        <ProfileCard
          href="/profile/favorites"
          title="علاقه‌مندی‌ها"
          icon={<Heart size={25} strokeWidth={1.2} />}
        />


        <ProfileCard
          href="/profile/settings"
          title="تنظیمات حساب"
          icon={<Settings size={25} strokeWidth={1.2} />}
        />


        <ProfileCard
          href="/profile/address"
          title="آدرس‌ها"
          icon={<MapPin size={25} strokeWidth={1.2} />}
        />

      </section>


      <section className={styles.logout}>
        <LogoutButton />
      </section>

    </main>
  );
}


function ProfileCard({
  href,
  title,
  icon,
}: {
  href:string;
  title:string;
  icon:React.ReactNode;
}) {

  return (
    <Link href={href} className={styles.card}>

      <div className={styles.icon}>
        {icon}
      </div>

      <span>
        {title}
      </span>

    </Link>
  );
}