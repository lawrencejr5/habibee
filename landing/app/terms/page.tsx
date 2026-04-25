import Image from "next/image";
import Link from "next/link";
import styles from "../legal.module.css";

export default function TermsAndConditions() {
  return (
    <>
      <nav className={styles.nav}>
        <Link href="/" className={styles.navBrand}>
          <Image
            src="/images/icon-nobg-white.png"
            alt="Habibee icon"
            width={36}
            height={36}
            className={styles.navIcon}
          />
          <div>
            <span className={styles.navTitle}>Habibee</span>
            <div className={styles.navBrandSub}>by Lawjun Labs</div>
          </div>
        </Link>
      </nav>

      <main className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Terms & Conditions</h1>
          <p className={styles.lastUpdated}>Last Updated: April 24, 2026</p>
        </header>

        <div className={styles.content}>
          <p>
            Welcome to Habibee! These Terms and Conditions outline the rules and
            regulations for the use of Lawjun Labs's Habibee Mobile Application
            and Website.
          </p>
          <p>
            By accessing this app, we assume you accept these terms and
            conditions. Do not continue to use Habibee if you do not agree to
            take all of the terms and conditions stated on this page.
          </p>

          <h2>1. License</h2>
          <p>
            Unless otherwise stated, Lawjun Labs and/or its licensors own the
            intellectual property rights for all material on Habibee. All
            intellectual property rights are reserved. You may access this from
            Habibee for your own personal use subjected to restrictions set in
            these terms and conditions.
          </p>
          <p>You must not:</p>
          <ul>
            <li>Republish material from Habibee.</li>
            <li>Sell, rent or sub-license material from Habibee.</li>
            <li>Reproduce, duplicate or copy material from Habibee.</li>
            <li>Redistribute content from Habibee.</li>
          </ul>

          <h2>2. User Accounts and Streaks</h2>
          <p>
            When you create an account with us, you must provide us information
            that is accurate, complete, and current at all times. Failure to do
            so constitutes a breach of the Terms, which may result in immediate
            termination of your account on our Service.
          </p>
          <p>
            The app's mechanics, including "streaks" and "hives", are intended
            for personal motivation and accountability. Lawjun Labs is not
            responsible for any loss of streak data due to device malfunction,
            network issues, or system updates, though we will make reasonable
            efforts to ensure data integrity.
          </p>

          <h2>3. User Generated Content (Hives)</h2>
          <p>
            Parts of this app offer an opportunity for users to interact within
            groups called "Hives." Lawjun Labs does not filter, edit, publish or
            review Comments prior to their presence on the app. Comments do not
            reflect the views and opinions of Lawjun Labs, its agents and/or
            affiliates.
          </p>
          <p>
            Lawjun Labs reserves the right to monitor all Comments and to remove
            any Comments which can be considered inappropriate, offensive or
            causes breach of these Terms and Conditions.
          </p>

          <h2>4. AI Features (Habibee AI)</h2>
          <p>
            Habibee utilizes Artificial Intelligence to provide coaching and
            insights. These insights are generated algorithmically and are for
            motivational and organizational purposes only. They do not
            constitute professional medical, psychological, or financial advice.
          </p>

          <h2>5. Disclaimer</h2>
          <p>
            To the maximum extent permitted by applicable law, we exclude all
            representations, warranties and conditions relating to our app and
            the use of this app. Nothing in this disclaimer will:
          </p>
          <ul>
            <li>
              limit or exclude our or your liability for death or personal
              injury;
            </li>
            <li>
              limit or exclude our or your liability for fraud or fraudulent
              misrepresentation;
            </li>
            <li>
              limit any of our or your liabilities in any way that is not
              permitted under applicable law; or
            </li>
            <li>
              exclude any of our or your liabilities that may not be excluded
              under applicable law.
            </li>
          </ul>
          <p>
            The limitations and prohibitions of liability set in this Section
            and elsewhere in this disclaimer: (a) are subject to the preceding
            paragraph; and (b) govern all liabilities arising under the
            disclaimer, including liabilities arising in contract, in tort and
            for breach of statutory duty.
          </p>

          <h2>6. Changes to Terms</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace
            these Terms at any time. What constitutes a material change will be
            determined at our sole discretion. By continuing to access or use
            our Service after those revisions become effective, you agree to be
            bound by the revised terms.
          </p>

          <h2>7. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at:
          </p>
          <p>
            <strong>Lawjun Labs</strong>
            <br />
            Email: <a href="mailto:contact@lawjun.ng">contact@lawjun.ng</a>
          </p>
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerLinks}>
          <Link href="/privacy" className={styles.footerLink}>
            Privacy Policy
          </Link>
          <Link href="/terms" className={styles.footerLink}>
            Terms & Conditions
          </Link>
        </div>
        <div className={styles.footerCopy}>© Lawjun Labs 2026</div>
      </footer>
    </>
  );
}
