import styles from "./page.module.css";

type Props = {
  searchParams: Promise<{
    phone?: string;
  }>;
};

export default async function VerifyPage({ searchParams }: Props) {
  const { phone = "" } = await searchParams;

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>VALINOR ACCOUNT</p>

        <h1>تأیید شماره موبایل</h1>

        <p className={styles.description}>
          کد ۶ رقمی ارسال‌شده به شماره موبایل خود را وارد کنید.
        </p>

        <form
          className={styles.form}
          action="/api/auth/verify-code"
          method="POST"
        >
          <input type="hidden" name="phone" value={phone} />

          <input
            name="code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            className={styles.input}
            required
          />

          <button type="submit" className={styles.button}>
            تأیید کد
          </button>
        </form>
      </section>
    </main>
  );
}