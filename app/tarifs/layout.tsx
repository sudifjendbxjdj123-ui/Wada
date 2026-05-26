import { pageMetadata } from "@/lib/pageMetadata";

export const metadata = pageMetadata({
  path: "/tarifs",
  title: "Tarifs WADA — gratuit ou premium",
  description: "WADA reste gratuit : palettes, scanner, tenues, assistant IA. Abonnement premium optionnel pour les fonctionnalités avancées.",
});

/* ──────────────────────────────────────────────────────────────────────
   JSON-LD Product + Offer (brief SEO 2026-05-23)
   ──────────────────────────────────────────────────────────────────────
   Permet à Google d'afficher le prix dans les rich snippets de la page
   tarifs (« WADA Premium 1.99 EUR/mois »). Aide pour les recherches type
   « wada abonnement », « prix wada premium ».
   Brief master (24/05) — corrections :
     - Nom « WADA+ » → « WADA Premium » (uniformisation côté client).
     - Devise CHF → EUR (Stripe prices sont en EUR, l'incohérence cassait
       la promesse côté Google et la conversion). */
const PRICING_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "WADA Premium",
  "description": "Abonnement WADA Premium : recommandations personnalisées, calendrier mensuel des tenues, accès anticipé aux nouvelles palettes, mode seconde main optimisé.",
  "brand": { "@type": "Brand", "name": "WADA" },
  "category": "Subscription Service",
  "offers": [
    {
      "@type": "Offer",
      "name": "WADA Premium Mensuel",
      "price": "1.99",
      "priceCurrency": "EUR",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": "1.99",
        "priceCurrency": "EUR",
        "unitText": "MONTH",
      },
      "availability": "https://schema.org/InStock",
      "url": "https://www.wada.style/tarifs",
    },
    {
      "@type": "Offer",
      "name": "WADA Premium Annuel",
      "price": "17.99",
      "priceCurrency": "EUR",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": "17.99",
        "priceCurrency": "EUR",
        "unitText": "YEAR",
      },
      "availability": "https://schema.org/InStock",
      "url": "https://www.wada.style/tarifs",
    },
  ],
};

export default function TarifsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(PRICING_JSONLD) }}
      />
      {children}
    </>
  );
}
