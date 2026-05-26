"use client";
/**
 * <ScanModeToggle /> — Toggle entre les 2 modes du Scanner WADA.
 *
 * Brief architecture 2026-05-20 :
 *   - Mode "Une couleur" → /scanner (détection teinte → palettes Wada)
 *   - Mode "Un vêtement" → /composer (détection pièce → outfit autour)
 *
 * Affiché en haut des 2 pages pour donner au client une nav claire entre
 * les modes. Le mode actif est highlight bordeaux ; l'inactif est outline
 * et navigue vers l'autre URL.
 */
import Link from "next/link";

interface ScanModeToggleProps {
  active: "couleur" | "vetement";
}

const palette = {
  beige: "#F4EFE7",
  cream: "#FAF8F4",
  bordeaux: "#6B3A32",
  ink: "#1E1E1E",
  line: "rgba(30,30,30,.10)",
};

export default function ScanModeToggle({ active }: ScanModeToggleProps) {
  return (
    <div style={{
      display: "inline-flex",
      gap: 4,
      padding: 4,
      background: palette.cream,
      border: `1px solid ${palette.line}`,
      borderRadius: 999,
      boxShadow: "0 4px 16px rgba(30,30,30,.06)",
    }}>
      <ModeButton
        label="Une couleur"
        emoji="◐"
        href="/scanner"
        active={active === "couleur"}
      />
      <ModeButton
        label="Un vêtement"
        emoji="◇"
        href="/composer"
        active={active === "vetement"}
      />
    </div>
  );
}

function ModeButton({
  label, emoji, href, active,
}: {
  label: string;
  emoji: string;
  href: string;
  active: boolean;
}) {
  const base: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "10px 18px",
    borderRadius: 999,
    fontFamily: "'Inter', sans-serif",
    fontSize: 13, fontWeight: 600,
    letterSpacing: "0.04em",
    textDecoration: "none",
    transition: "all 0.2s cubic-bezier(.22,1,.36,1)",
    cursor: active ? "default" : "pointer",
  };
  if (active) {
    return (
      <span aria-current="page" style={{
        ...base,
        background: palette.bordeaux,
        color: palette.cream,
      }}>
        <span aria-hidden style={{ fontSize: 14, opacity: 0.9 }}>{emoji}</span>
        <span>{label}</span>
      </span>
    );
  }
  return (
    <Link href={href} style={{
      ...base,
      background: "transparent",
      color: palette.ink,
    }}>
      <span aria-hidden style={{ fontSize: 14, opacity: 0.6 }}>{emoji}</span>
      <span>{label}</span>
    </Link>
  );
}
