import Image from "next/image";
import Link from "next/link";
import styles from "../legal.module.css";

export default function PrivacyPolicy() {
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
          <h1 className={styles.title}>Privacy Policy</h1>
          <p className={styles.lastUpdated}>Last Updated: April 24, 2026</p>
        </header>

        <div className={styles.content}>
          <p>
            At Lawjun Labs, we take your privacy seriously. This Privacy Policy
            explains how we collect, use, disclose, and safeguard your
            information when you visit our Habibee mobile application and
            website. Please read this privacy policy carefully. If you do not
            agree with the terms of this privacy policy, please do not access
            the application.
          </p>

          <h2>1. Information We Collect</h2>
          <p>
            We may collect information about you in a variety of ways. The
            information we may collect via the Application includes:
          </p>
          <ul>
            <li>
              <strong>Personal Data:</strong> Personally identifiable
              information, such as your name, email address, and profile
              picture, that you voluntarily give to us when you register with
              the Application.
            </li>
            <li>
              <strong>Derivative Data:</strong> Information our servers
              automatically collect when you access the Application, such as
              your native actions that are integral to the Application,
              including tracking habits, streaks, and interactions with Hives.
            </li>
            <li>
              <strong>Mobile Device Data:</strong> Device information, such as
              your mobile device ID, model, and manufacturer, and information
              about the location of your device, if you access the Application
              from a mobile device.
            </li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>
            Having accurate information about you permits us to provide you with
            a smooth, efficient, and customized experience. Specifically, we may
            use information collected about you via the Application to:
          </p>
          <ul>
            <li>Create and manage your account.</li>
            <li>
              Power the Habibee AI coaching features to provide personalized
              recommendations.
            </li>
            <li>
              Monitor and analyze usage and trends to improve your experience
              with the Application.
            </li>
            <li>Notify you of updates to the Application.</li>
            <li>
              Send you reminders for your habits if you have enabled
              notifications.
            </li>
          </ul>

          <h2>3. Disclosure of Your Information</h2>
          <p>
            We may share information we have collected about you in certain
            situations. Your information may be disclosed as follows:
          </p>
          <ul>
            <li>
              <strong>By Law or to Protect Rights:</strong> If we believe the
              release of information about you is necessary to respond to legal
              process, to investigate or remedy potential violations of our
              policies, or to protect the rights, property, and safety of
              others.
            </li>
            <li>
              <strong>Third-Party Service Providers:</strong> We may share your
              information with third parties that perform services for us or on
              our behalf, including data analysis, email delivery, hosting
              services, and customer service.
            </li>
            <li>
              <strong>Interactions with Other Users:</strong> If you interact
              with other users of the Application (such as in a "Hive"), those
              users may see your name, profile photo, and descriptions of your
              activity.
            </li>
          </ul>

          <h2>4. Security of Your Information</h2>
          <p>
            We use administrative, technical, and physical security measures to
            help protect your personal information. While we have taken
            reasonable steps to secure the personal information you provide to
            us, please be aware that despite our efforts, no security measures
            are perfect or impenetrable, and no method of data transmission can
            be guaranteed against any interception or other type of misuse.
          </p>

          <h2>5. Children's Privacy</h2>
          <p>
            We do not knowingly solicit information from or market to children
            under the age of 13. If we learn that we have collected personal
            information from a child under age 13 without verification of
            parental consent, we will delete that information as quickly as
            possible.
          </p>

          <h2>6. Contact Us</h2>
          <p>
            If you have questions or comments about this Privacy Policy, please
            contact us at:
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
