"use client";
import { usePathname } from "next/navigation";

/**
 * LangButton — bouton « EN » qui redirige vers la version anglaise via
 * le proxy officiel Google translate.goog.
 *
 * Brief client 2026-05-28 : « le site offre-t-il la traduction pour les
 * anglais ? » → non, le site est mono-FR. Plutôt qu'un i18n complet
 * (next-intl + traduction des 348 palettes éditoriales + stylist EN +
 * emails Resend EN = plusieurs semaines), on offre un bouton EN qui
 * passe par le proxy Google translate.goog : gratuit, fonctionne sur
 * 100 % du site (palettes, styliste, etc.), qualité Google Translate.
 *
 * URL pattern officiel Google (depuis 2022) :
 *   https://[host-with-hyphens].translate.goog/[path]?_x_tr_sl=fr&_x_tr_tl=en&_x_tr_hl=en
 *
 * Exemple WADA :
 *   https://www-wada-style.translate.goog/palette/162?_x_tr_sl=fr&_x_tr_tl=en&_x_tr_hl=en
 *
 * Google ajoute une barre discrète en haut avec switch FR/EN — le user
 * peut revenir en FR depuis cette barre. Si on est déjà sur le proxy,
 * on cache le bouton (Google gère le switch).
 */

/* Variante visuelle :
   - "pill" : pastille texte (desktop right side) — discret
   - "drawer-row" : ligne complète (drawer mobile) — accessible */
type Variant = "pill" | "drawer-row";

const PROXY_HOST = "www-wada-style.translate.goog";
const PROD_HOST = "www.wada.style";

function buildTranslateUrl(pathname: string): string {
  /* Reconstruit l'URL via proxy Google.
     `_x_tr_sl` = source lang, `_x_tr_tl` = target lang, `_x_tr_hl` =
     UI lang de la barre Google. */
  const search = typeof window !== "undefined" ? window.location.search : "";
  return `https://${PROXY_HOST}${pathname}${search}${search ? "&" : "?"}_x_tr_sl=fr&_x_tr_tl=en&_x_tr_hl=en`;
}

export default function LangButton({ variant = "pill" }: { variant?: Variant }) {
  const pathname = usePathname() || "/";

  /* Détecte si on est déjà sur le proxy Google → on cache le bouton.
     L'utilisateur peut revenir en FR via la barre Google native. */
  if (typeof window !== "undefined" && window.location.hostname === PROXY_HOST) {
    return null;
  }

  const href = buildTranslateUrl(pathname);

  if (variant === "drawer-row") {
    return (
      <a
        href={href}
        aria-label="Translate this page to English"
        title="Translate to English via Google"
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 0",
          borderBottom: "1px solid var(--wada-border, rgba(30,30,30,.08))",
          fontFamily: "'Fredoka', sans-serif",
          fontSize: "1.05rem",
          color: "var(--wada-ink, #1E1E1E)",
          textDecoration: "none",
        }}
      >
        <span>Language</span>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontFamily: "'Inter', sans-serif",
          fontSize: 13, fontWeight: 600,
          letterSpacing: "0.06em",
          color: "var(--wada-subtle, #6a6259)",
        }}>
          <span aria-hidden>FR</span>
          <span aria-hidden style={{ opacity: 0.5 }}>·</span>
          <span style={{ color: "#6B3A32" }}>EN →</span>
        </span>
      </a>
    );
  }

  // pill (desktop)
  return (
    <a
      href={href}
      aria-label="Translate this page to English"
      title="Translate to English via Google"
      className="wada-nav-lang"
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Inter', sans-serif",
        fontSize: 12, fontWeight: 600,
        letterSpacing: "0.08em",
        color: "var(--wada-ink, #1E1E1E)",
        textDecoration: "none",
        border: "1px solid var(--wada-border, rgba(30,30,30,.12))",
        background: "transparent",
        borderRadius: 999,
        padding: "7px 12px",
        lineHeight: 1,
        transition: "background .2s ease, border-color .2s ease",
        whiteSpace: "nowrap",
      }}
    >
      EN
    </a>
  );
}
