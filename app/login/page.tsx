import styles from "./page.module.css";

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>VALINOR ACCOUNT</p>

        <h1>ورود به حساب کاربری</h1>

        <p className={styles.description}>
          برای ورود یا ثبت‌نام، شماره موبایل خود را وارد کنید. کد تأیید برای
          شما ارسال خواهد شد.
        </p>

        <form
          className={styles.form}
          action="/api/auth/send-code"
          method="POST"
        >
          <input
            name="phone"
            type="tel"
            placeholder="09xxxxxxxxx"
            className={styles.input}
            required
          />

          <button type="submit" className={styles.button}>
            دریافت کد
          </button>
        </form>
      </section>
    </main>
  );
}