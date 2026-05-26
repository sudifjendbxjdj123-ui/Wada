import { ink, border, seal } from "@/lib/styles";
import { brandScores } from "@/lib/data";
import type { ShopLink as ShopLinkType } from "@/lib/data";
import ExternalLink from "./ExternalLink";

interface ShopLinkProps {
  link: ShopLinkType;
}

/**
 * Bouton vers une boutique partenaire (Vinted, Zara, COS…).
 * Affiche le WADA Score (0-5★) en coin si la marque a une note.
 * Hover lift via .wada-lift-sm.
 *
 * Utilise ExternalLink → préserve les cookies d'affiliation Awin/Amazon
 * quand l'app tourne dans le wrapper Capacitor natif (SFSafariViewController
 * iOS / Custom Tabs Android).
 */
export default function ShopLink({ link }: ShopLinkProps) {
  const score = brandScores[link.label] ?? 0;
  return (
    <ExternalLink
      href={link.url}
      className="wada-lift-sm"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        padding: "8px 14px",
        border: `1px solid ${border}`,
        background: "#FAF6EE",
        color: ink,
        textDecoration: "none",
        fontFamily: "'Inter', sans-serif",
        position: "relative",
      }}
      onMouseEnter={(ev) => { ev.currentTarget.style.borderColor = ink; }}
      onMouseLeave={(ev) => { ev.currentTarget.style.borderColor = border; }}
    >
      <span style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600 }}>
        {link.label}
      </span>
      <span style={{ fontSize: 8, letterSpacing: "0.15em", textTransform: "uppercase", opacity: 0.6, marginTop: 2 }}>
        {link.sub}
      </span>
      {score > 0 && (
        <span
          aria-label={`WADA Score : ${score} sur 5`}
          title={`WADA Score : ${score}/5`}
          style={{
            position: "absolute",
            top: 4,
            right: 6,
            fontSize: 9,
            color: seal,
            fontFamily: "'Inter', sans-serif",
            letterSpacing: 0,
          }}
        >
          {"★".repeat(score)}
        </span>
      )}
    </ExternalLink>
  );
}
