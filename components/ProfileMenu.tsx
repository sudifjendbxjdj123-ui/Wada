"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import ProfileSwitcher from "@/components/ProfileSwitcher";

/**
 * ProfileMenu — refonte Nav 2026-05-30 (brief maquette).
 *
 * Remplace ProfileBadge + ThemeToggle isolé + LangButton isolé du header.
 *
 * Avatar bordeaux 38×38 avec :
 *   - Initiale F/H du genre profil
 *   - Petit point vert en bottom-right (= profil actif, signal de présence)
 *   - Tooltip qui s'ouvre au hover ou au focus clavier : « Femme · 150–400€ ·
 *     Minimaliste »
 *   - Clic → menu dropdown qui contient :
 *       → Mon profil (raccourci /compte)
 *       → Changer mon style (ouvre ProfileSwitcher modal)
 *       → Toggle Thème (jour / nuit / système)
 *       → Langue (FR / EN via Google Translate proxy)
 *
 * Le clic-extérieur ferme le menu. Échap aussi.
 */

const BORDEAUX = "#6B3A32";
const BORDEAUX_DARK = "#5a3029";
const CREAM = "#FAF8F4";
const INK = "#1E1E1E";
const INK_SOFT = "#6a6259";
const LINE = "rgba(30,30,30,.10)";
const ONLINE_GREEN = "#84a060";

const PROXY_HOST = "www-wada-style.translate.goog";

export default function ProfileMenu() {
  const { effective, hydrated } = useProfile();
  const [open, setOpen] = useState(false);
  const [tooltipShown, setTooltipShown] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const pathname = usePathname() || "/";
  const ref = useRef<HTMLDivElement>(null);

  /* Clic extérieur ferme le menu. */
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  if (!hydrated) return null;

  const initial = effective.genre[0];
  const tooltipText = `${effective.genre} · ${effective.budget} · ${effective.style}`;

  /* Détecte si on est déjà sur le proxy Google Translate → on cache l'option EN. */
  const onProxy = typeof window !== "undefined" && window.location.hostname === PROXY_HOST;
  const translateHref = !onProxy
    ? `https://${PROXY_HOST}${pathname}${typeof window !== "undefined" ? window.location.search : ""}${typeof window !== "undefined" && window.location.search ? "&" : "?"}_x_tr_sl=fr&_x_tr_tl=en&_x_tr_hl=en`
    : null;

  /* Thème toggle inline — accède directement à <html data-theme="..."> +
     localStorage["wada-theme"]. Pas de subscribe React, on toggle directement. */
  const toggleTheme = () => {
    try {
      const current = document.documentElement.getAttribute("data-theme") || "jour";
      const next = current === "jour" ? "nuit" : "jour";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("wada-theme", next);
    } catch {}
  };

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      {/* AVATAR — bouton circulaire bordeaux compact */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setTooltipShown(true)}
        onMouseLeave={() => setTooltipShown(false)}
        onFocus={() => setTooltipShown(true)}
        onBlur={() => setTooltipShown(false)}
        aria-label={`Profil : ${tooltipText}. Cliquez pour ouvrir le menu.`}
        aria-expanded={open}
        aria-haspopup="menu"
        style={{
          position: "relative",
          width: 38, height: 38, borderRadius: "50%",
          background: BORDEAUX, color: CREAM,
          border: "none", cursor: "pointer",
          fontFamily: "'Fredoka', sans-serif",
          fontWeight: 600, fontSize: 14,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.18s ease, transform 0.18s ease",
          padding: 0,
        }}
        onMouseDown={(ev) => { ev.currentTarget.style.transform = "scale(0.94)"; }}
        onMouseUp={(ev) => { ev.currentTarget.style.transform = "scale(1)"; }}
      >
        {initial}
        {/* Point vert "actif" en bottom-right, encerclé par un halo qui
            découpe sur le fond pour la lisibilité (sur Nav crème ou sombre). */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            right: -1, bottom: -1,
            width: 10, height: 10,
            background: ONLINE_GREEN,
            borderRadius: "50%",
            border: "2px solid var(--wada-paper, #F4EFE7)",
          }}
        />
      </button>

      {/* Tooltip au hover — caché si menu ouvert (le menu remplace le tooltip). */}
      {tooltipShown && !open && (
        <div
          role="tooltip"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            background: "#222",
            color: "#fff",
            padding: "7px 12px",
            borderRadius: 8,
            fontFamily: "'Inter', sans-serif",
            fontSize: 12,
            fontWeight: 500,
            whiteSpace: "nowrap",
            boxShadow: "0 8px 22px rgba(0,0,0,0.18)",
            pointerEvents: "none",
            zIndex: 80,
            animation: "wada-tooltip-fade 0.14s ease-out",
          }}
        >
          {tooltipText}
        </div>
      )}

      {/* MENU DROPDOWN */}
      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            minWidth: 240,
            background: "var(--wada-paper, " + CREAM + ")",
            border: `1px solid ${LINE}`,
            borderRadius: 16,
            boxShadow: "0 18px 48px rgba(0,0,0,0.16)",
            padding: 8,
            zIndex: 80,
            animation: "wada-menu-fade 0.16s ease-out",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {/* Header menu : avatar + label profil complet */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 12px 12px",
            borderBottom: `1px solid ${LINE}`,
            marginBottom: 8,
          }}>
            <span style={{
              width: 36, height: 36, borderRadius: "50%",
              background: BORDEAUX, color: CREAM,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 14,
              flexShrink: 0,
            }}>
              {initial}
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: BORDEAUX }}>
                Mon profil
              </span>
              <span style={{ fontSize: 13, color: INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {tooltipText}
              </span>
            </div>
          </div>

          {/* Lien Compte */}
          <MenuItem href="/compte" onClick={() => setOpen(false)}>
            <IconUser />
            <span>Mon compte</span>
          </MenuItem>

          {/* Lien Favoris */}
          <MenuItem href="/favoris" onClick={() => setOpen(false)}>
            <IconHeart />
            <span>Mes favoris</span>
          </MenuItem>

          {/* Changer mon style → ouvre ProfileSwitcher modal */}
          <MenuItem onClick={() => { setOpen(false); setSwitcherOpen(true); }}>
            <IconSparkle />
            <span>Changer mon style</span>
          </MenuItem>

          <div style={{ height: 1, background: LINE, margin: "8px 4px" }} />

          {/* Thème */}
          <MenuItem onClick={toggleTheme}>
            <IconMoon />
            <span>Thème jour / nuit</span>
          </MenuItem>

          {/* Langue */}
          {translateHref && (
            <MenuItem href={translateHref} external onClick={() => setOpen(false)}>
              <IconGlobe />
              <span>English (via Google)</span>
            </MenuItem>
          )}
        </div>
      )}

      <ProfileSwitcher open={switcherOpen} onClose={() => setSwitcherOpen(false)} />

      <style jsx>{`
        @keyframes wada-tooltip-fade {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes wada-menu-fade {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          div { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────── MenuItem (lien ou bouton) ─────────────────── */
function MenuItem({ href, external, onClick, children }: {
  href?: string;
  external?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const baseStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 10,
    fontSize: 13.5,
    fontWeight: 500,
    color: INK,
    background: "transparent",
    border: "none",
    width: "100%",
    textAlign: "left",
    cursor: "pointer",
    textDecoration: "none",
    transition: "background 0.14s ease",
    fontFamily: "'Inter', sans-serif",
  };

  const hoverEnter = (ev: React.MouseEvent<HTMLElement>) => {
    ev.currentTarget.style.background = "rgba(107,58,50,0.07)";
  };
  const hoverLeave = (ev: React.MouseEvent<HTMLElement>) => {
    ev.currentTarget.style.background = "transparent";
  };

  if (href && external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        style={baseStyle}
        onMouseEnter={hoverEnter}
        onMouseLeave={hoverLeave}
        role="menuitem"
      >
        {children}
      </a>
    );
  }
  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        style={baseStyle}
        onMouseEnter={hoverEnter}
        onMouseLeave={hoverLeave}
        role="menuitem"
      >
        {children}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      style={baseStyle}
      onMouseEnter={hoverEnter}
      onMouseLeave={hoverLeave}
      role="menuitem"
    >
      {children}
    </button>
  );
}

/* ─────────────────── Icônes inline ─────────────────── */
const iconProps = {
  width: 16, height: 16, viewBox: "0 0 24 24",
  fill: "none", stroke: "currentColor", strokeWidth: 1.6,
  strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  style: { color: INK_SOFT, flexShrink: 0 },
};
function IconUser() {
  return <svg {...iconProps}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" /></svg>;
}
function IconHeart() {
  return <svg {...iconProps}><path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" /></svg>;
}
function IconSparkle() {
  return <svg {...iconProps}><path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" /></svg>;
}
function IconMoon() {
  return <svg {...iconProps}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>;
}
function IconGlobe() {
  return <svg {...iconProps}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>;
}
