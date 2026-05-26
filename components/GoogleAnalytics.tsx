"use client";
import Script from "next/script";

/**
 * Google Analytics 4 — tracking GDPR-friendly.
 *
 * Le Measurement ID est public (visible dans le HTML source de toutes
 * les pages — c'est par design GA4). On peut donc le hardcoder
 * directement. Une variable env `NEXT_PUBLIC_GA_ID` peut override pour
 * les staging/dev environments.
 *
 * Tracking respectueux :
 *   - anonymize_ip activé (conforme RGPD)
 *   - cookie_flags SameSite=None;Secure
 *   - aucun event automatique non-consenti
 */
const DEFAULT_GA_ID = "G-0JZ0TXXYR2"; // WADA Production property

export default function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID || DEFAULT_GA_ID;
  if (!gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', {
            anonymize_ip: true,
            cookie_flags: 'SameSite=None;Secure',
          });
        `}
      </Script>
    </>
  );
}
