"use client";
import type { CSSProperties, ReactNode, MouseEvent } from "react";
import { openExternal } from "@/lib/native";

interface ExternalLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Tooltip natif. */
  title?: string;
  /** aria-label si le contenu textuel n'est pas explicite. */
  "aria-label"?: string;
  /** Permet de passer des handlers de souris (mouseEnter/Leave) pour les effets de hover. */
  onMouseEnter?: (e: MouseEvent<HTMLAnchorElement>) => void;
  onMouseLeave?: (e: MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * Lien sortant qui s'ouvre :
 *   - dans le navigateur in-app Capacitor (SFSafariViewController iOS /
 *     Custom Tabs Android) si l'app tourne en natif — important pour
 *     préserver les cookies tiers Awin/Amazon Associates et donc le
 *     tracking de la commission d'affiliation
 *   - dans un nouvel onglet du navigateur en mode web pur
 *
 * Le `href` est conservé pour :
 *   - accessibilité (lecteur d'écran annonce le lien correctement)
 *   - clic milieu / clic droit "ouvrir dans un nouvel onglet"
 *   - cas où JS échoue
 *
 * À utiliser PARTOUT à la place de `<a target="_blank">` pour les liens
 * sortants vers les marchands/marques.
 */
export default function ExternalLink({
  href,
  children,
  className,
  style,
  title,
  "aria-label": ariaLabel,
  onMouseEnter,
  onMouseLeave,
}: ExternalLinkProps) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Laisse passer les clics modifiés (ctrl/cmd-click, middle-click) :
    // l'utilisateur attend l'ouverture dans un nouvel onglet du navigateur.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    void openExternal(href);
  };

  return (
    <a
      href={href}
      target="_blank"
      // Brief finition (24/05) §7 — liens sortants marchands :
      //   noopener     → sécurité (cible ne peut pas hijacker window.opener)
      //   noreferrer   → préserve la vie privée
      //   nofollow     → on ne transmet pas notre PageRank à un partenaire
      //   sponsored    → déclare le lien comme partenariat commercial
      //                  (Google Webmaster guidelines pour l'affiliation)
      rel="noopener noreferrer nofollow sponsored"
      className={className}
      style={style}
      title={title}
      aria-label={ariaLabel}
      onClick={handleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </a>
  );
}
