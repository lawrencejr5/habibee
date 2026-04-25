"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import styles from "./page.module.css";

/* ─── Data ─── */
const FEATURES = [
  {
    tag: "Organization",
    title: "Total Organization",
    desc: "All your goals, categorized and easy to manage. Create habits with custom icons, colors, reminders, and track them daily with a single tap.",
    image: "/images/onboarding_1.png",
  },
  {
    tag: "Sub-Habits",
    title: "Break It Down",
    desc: "Turn big goals into manageable, atomic steps. Add sub-habits with individual reminders so nothing slips through the cracks.",
    image: "/images/onboarding_2.png",
  },
  {
    tag: "Progress",
    title: "Visualize Your Growth",
    desc: "Track your consistency with an elegant, interactive activity grid. See your current streak, goal progress, and how far you've come at a glance.",
    image: "/images/onboarding_3.png",
  },
  {
    tag: "AI Powered",
    title: "Habibee AI at Your Disposal",
    desc: "Let AI build and manage the perfect routine tailored to your lifestyle. Get personalized habit recommendations, motivation, and progress analysis.",
    image: "/images/onboarding_4.png",
  },
  {
    tag: "Focus",
    title: "Focus in the Moment",
    desc: "Use the precision timer to crush your habits without distractions. Set a duration, start the timer, and stay locked in until the bell rings.",
    image: "/images/onboarding_5.png",
  },
  {
    tag: "Community",
    title: "Build Your Hive",
    desc: "Stay accountable with your inner circle. Create or join a Hive, track each other's streaks, and buzz friends to keep everyone on track.",
    image: "/images/onboarding_6.png",
  },
];

const FAQS = [
  {
    q: "Is Habibee free to use?",
    a: "Yes! Habibee is completely free to download and use. All core features including habit tracking, sub-habits, streaks, and Hive are available at no cost. Habibee AI is also free to try.",
  },
  {
    q: "How does the streak system work?",
    a: "Every day you complete a habit, your streak count goes up by one. Miss a day and the streak resets. For habits with sub-habits, all sub-habits must be completed before you can record your daily streak.",
  },
  {
    q: "What is a Hive?",
    a: "A Hive is your accountability group. You can create or join a Hive with friends, share an invite code, and see each other's streaks. You can also nudge members who are falling behind to keep everyone motivated.",
  },
  {
    q: "Can I set reminders for my habits?",
    a: "Absolutely. You can set custom reminder times for each habit and even for individual sub-habits. Habibee sends you push notifications so you never miss a beat.",
  },
  {
    q: "What platforms is Habibee available on?",
    a: "Habibee is available on both Android (Google Play Store) and iOS (App Store). Your data syncs seamlessly across devices.",
  },
  {
    q: "How does Habibee AI help me?",
    a: "Habibee AI can generate new habit suggestions, analyze your progress, provide motivation, and help optimize your daily routine — all tailored to your existing habits and goals.",
  },
];

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (i: number) => setOpenFaq(openFaq === i ? null : i);

  return (
    <>
      {/* ─── NAVBAR ─── */}
      <nav className={styles.nav}>
        <div className={styles.navBrand}>
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
        </div>

        <div className={styles.navLinks}>
          <Link href="#features" className={styles.navLink}>
            Features
          </Link>
          <Link href="#faq" className={styles.navLink}>
            FAQ
          </Link>
          <Link href="/privacy" className={styles.navLink}>
            Privacy Policy
          </Link>
          <Link href="/terms" className={styles.navLink}>
            Terms &amp; Conditions
          </Link>
          <a
            href="https://play.google.com/store/apps/details?id=com.lawrencejr.habibee"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.navCta}
          >
            Download App
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className={styles.navHamburger}
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open menu"
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.mobileMenuOpen : ""}`}
      >
        <button
          className={styles.mobileMenuClose}
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close menu"
        >
          ✕
        </button>
        <Link
          href="#features"
          className={styles.mobileMenuLink}
          onClick={() => setMobileMenuOpen(false)}
        >
          Features
        </Link>
        <Link
          href="#faq"
          className={styles.mobileMenuLink}
          onClick={() => setMobileMenuOpen(false)}
        >
          FAQ
        </Link>
        <Link
          href="/privacy"
          className={styles.mobileMenuLink}
          onClick={() => setMobileMenuOpen(false)}
        >
          Privacy Policy
        </Link>
        <Link
          href="/terms"
          className={styles.mobileMenuLink}
          onClick={() => setMobileMenuOpen(false)}
        >
          Terms &amp; Conditions
        </Link>
        <a
          href="https://play.google.com/store"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.navCta}
          onClick={() => setMobileMenuOpen(false)}
        >
          Download App
        </a>
      </div>

      {/* ─── HERO BANNER ─── */}
      <section className={styles.heroWrapper}>
        <div className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Keep Streaks
              <br />
              with <span className={styles.heroHighlight}>Habibee</span>
            </h1>
            <p className={styles.heroSub}>
              Build atomic habits, track your progress with beautiful activity
              grids, get AI-powered coaching, and stay accountable with your
              inner circle — all in one app.
            </p>
            <div className={styles.heroCtas}>
              <a
                href="https://play.google.com/store/apps/details?id=com.lawrencejr.habibee"
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.storeBtn} ${styles.storeBtnPrimary}`}
              >
                <Image
                  src="/images/googleplay-icon.png"
                  alt="Google Play"
                  width={24}
                  height={24}
                  className={styles.storeBtnIcon}
                />
                <span className={styles.storeBtnText}>
                  <span className={styles.storeBtnLabel}>Get it on</span>
                  <span className={styles.storeBtnStore}>Google Play</span>
                </span>
              </a>
              <a
                href="https://apps.apple.com"
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.storeBtn} ${styles.storeBtnSecondary}`}
              >
                <Image
                  src="/images/apple-icon.png"
                  alt="App Store"
                  width={22}
                  height={22}
                  className={styles.storeBtnIcon}
                />
                <span className={styles.storeBtnText}>
                  <span className={styles.storeBtnLabel}>Download on</span>
                  <span className={styles.storeBtnStore}>App Store</span>
                </span>
              </a>
            </div>
          </div>

          <div className={styles.heroImageWrap}>
            <div className={styles.heroGlow} />
            <Image
              src="/images/Habibee.png"
              alt="Habibee app preview"
              width={420}
              height={500}
              className={styles.heroImage}
              priority
            />
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className={styles.section} id="features">
        <span className={styles.sectionLabel}>Explore Habibee</span>
        <h2 className={styles.sectionTitle}>
          Everything you need to
          <br />
          build better habits
        </h2>
        <p className={styles.sectionSub}>
          From organizing your goals to staying accountable with friends,
          Habibee has every tool you need to transform your daily routine.
        </p>

        {FEATURES.map((feature, i) => (
          <div
            key={i}
            className={`${styles.featureRow} ${i % 2 !== 0 ? styles.featureRowReverse : ""}`}
          >
            <div className={styles.featureImageWrap}>
              <div className={styles.featureImageGlow} />
              <Image
                src={feature.image}
                alt={feature.title}
                width={300}
                height={400}
                className={styles.featureImage}
              />
            </div>
            <div className={styles.featureContent}>
              <span className={styles.featureTag}>{feature.tag}</span>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDesc}>{feature.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ─── FAQ ─── */}
      <section className={styles.faqSection} id="faq">
        <span className={styles.sectionLabel}>FAQ</span>
        <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
        <p className={styles.sectionSub}>
          Got questions? We&apos;ve got answers. If you can&apos;t find what
          you&apos;re looking for, feel free to reach out.
        </p>

        <div className={styles.faqGrid}>
          {FAQS.map((faq, i) => (
            <div key={i} className={styles.faqItem}>
              <button
                className={styles.faqToggle}
                onClick={() => toggleFaq(i)}
                aria-expanded={openFaq === i}
              >
                {faq.q}
                <span
                  className={`${styles.faqChevron} ${openFaq === i ? styles.faqChevronOpen : ""}`}
                >
                  ▾
                </span>
              </button>
              {openFaq === i && <div className={styles.faqAnswer}>{faq.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className={styles.footer}>
        <div className={styles.footerLinks}>
          <Link href="/privacy" className={styles.footerLink}>
            Privacy Policy
          </Link>
          <Link href="/terms" className={styles.footerLink}>
            Terms &amp; Conditions
          </Link>
        </div>
        <span className={styles.footerCopy}>© Lawjun Labs 2026</span>
      </footer>
    </>
  );
}
