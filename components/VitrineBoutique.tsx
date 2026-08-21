"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDisplayImageUrl } from "@/lib/image-utils";
import {
  ink, border, textSecondary, mojo,
  fontHeading, fontBody, fontLabel,
} from "@/lib/styles";

/**
 * VitrineBoutique — le bandeau « jusqu'à −N% » et la rangée « Tendances
 * maintenant », entre les filtres et le catalogue de /boutique.
 *
 * Maquette client 2026-08-22 (« je veux EXACTEMENT ça »).
 *
 * Deux partis pris, tous les deux au service de l'honnêteté commerciale :
 *
 *  1. Le pourcentage du bandeau est CALCULÉ sur les produits réellement
 *     soldés par les marchands (`prixOriginal` du flux Awin). Si aucun
 *     produit n'est en promotion, le bandeau ne s'affiche pas du tout —
 *     annoncer une remise qui n'existe pas serait de la publicité mensongère,
 *     et le client s'en apercevrait au premier clic.
 *
 *  2. Les marques listées sont celles qui ont VRAIMENT une pièce soldée, pas
 *     une liste écrite en dur. Elles sont composées en typographie WADA et
 *     non en logos : le dépôt n'a aucun fichier de logo, et fabriquer de
 *     faux logos de marques serait à la fois laid et juridiquement douteux.
 *
 * Une seule salve de deux requêtes, lancées EN PARALLÈLE : le catalogue de la
 * page en fait déjà une, et empiler des appels séquentiels sur une route
 * serverless qui balaie le KV est précisément ce qui coûtait 5 s d'attente
 * sur /ma-tenue.
 */

type Produit = {
  id?: string;
  nom: string;
  marque?: string;
  marchand?: string;
  image?: string;
  largeImage?: string;
  prix?: number;
  prixOriginal?: number;
  description?: string;
};

/* Thèmes de la rangée « Tendances maintenant ». Le `motif` sert à choisir une
   photo réelle du catalogue pour la vignette ; le `q` est la recherche vers
   laquelle la tuile emmène. Aucune image n'est stockée : les visuels viennent
   des produits, donc ils suivent le catalogue sans maintenance. */
const TENDANCES: Array<{ titre: string; sous: string; q: string; motif: RegExp }> = [
  { titre: "Lin & naturel", sous: "Matières naturelles", q: "lin",
    motif: /\blin\b|linen|coton|cotton|chanvre/i },
  { titre: "Sneakers", sous: "Les incontournables", q: "sneakers",
    motif: /sneaker|basket|trainer|running/i },
  { titre: "Maille", sous: "Douceur et volume", q: "pull",
    motif: /pull|maille|knit|sweat|cardigan/i },
  { titre: "Tailoring", sous: "Lignes nettes", q: "blazer",
    motif: /blazer|veste|manteau|costume|pinces/i },
  { titre: "Denim", sous: "Le basique qui dure", q: "jean",
    motif: /jean|denim/i },
  { titre: "Accessoires", sous: "Le détail qui compte", q: "sac",
    motif: /sac|ceinture|casquette|bonnet|lunettes|foulard/i },
];

function Fleche({ taille = 14 }: { taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" aria-hidden fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export default function VitrineBoutique({ genre }: { genre?: string | null }) {
  const router = useRouter();
  const [promos, setPromos] = useState<Produit[]>([]);
  const [pool, setPool] = useState<Produit[]>([]);

  useEffect(() => {
    const ac = new AbortController();
    const g = genre ? `&genre=${encodeURIComponent(genre.toLowerCase())}` : "";
    (async () => {
      try {
        /* En parallèle : une salve, une latence. */
        const [rPromo, rPool] = await Promise.all([
          fetch(`/api/products?promo=1&limit=12${g}`, { signal: ac.signal }),
          fetch(`/api/products?limit=48${g}`, { signal: ac.signal }),
        ]);
        if (rPromo.ok) {
          const d = await rPromo.json();
          setPromos(d.products ?? []);
        }
        if (rPool.ok) {
          const d = await rPool.json();
          setPool(d.products ?? []);
        }
      } catch { /* abort au démontage, ou réseau : la page reste utilisable */ }
    })();
    return () => ac.abort();
  }, [genre]);

  /* Remise maximale RÉELLE parmi les produits soldés rapportés. */
  const remiseMax = promos.reduce((max, p) => {
    if (typeof p.prixOriginal !== "number" || typeof p.prix !== "number") return max;
    if (p.prixOriginal <= p.prix) return max;
    return Math.max(max, Math.round((1 - p.prix / p.prixOriginal) * 100));
  }, 0);

  /* Marques ayant vraiment une pièce soldée, sans doublon, cinq au plus. */
  const marquesEnPromo = [...new Set(
    promos.map((p) => (p.marque || p.marchand || "").trim()).filter(Boolean),
  )].slice(0, 5);

  const tuiles = TENDANCES.map((t) => {
    const trouve = pool.find((p) => t.motif.test(`${p.nom} ${p.description ?? ""}`));
    return { ...t, image: trouve ? getDisplayImageUrl(trouve.image, trouve.largeImage) : null };
  }).filter((t) => t.image);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
      {/* ── Bandeau remises ─────────────────────────────────────────────
          Affiché SEULEMENT si des produits sont réellement soldés. */}
      {remiseMax > 0 && marquesEnPromo.length > 0 && (
        <section style={{
          background: "#FFFDFA", border: `1px solid ${border}`, borderRadius: 16,
          padding: "14px 16px", margin: "0 0 22px",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
          }}>
            <div style={{ flexShrink: 0 }}>
              <p style={{
                fontFamily: fontLabel, fontSize: 10, letterSpacing: ".14em",
                textTransform: "uppercase", color: mojo, margin: 0,
              }}>
                Jusqu&rsquo;à
              </p>
              <p style={{
                fontFamily: fontHeading, fontSize: 30, color: mojo,
                margin: "1px 0 0", lineHeight: 1,
              }}>
                −{remiseMax}%
              </p>
              <p style={{
                fontFamily: fontBody, fontSize: 12.5, color: textSecondary,
                margin: "4px 0 0", maxWidth: "16ch", lineHeight: 1.35,
              }}>
                sur une sélection de marques
              </p>
            </div>

            {/* Marques en typographie, pas en logos — voir l'en-tête. */}
            <ul style={{
              flex: 1, minWidth: 0, listStyle: "none", padding: 0, margin: 0,
              display: "flex", alignItems: "center", gap: 18,
              overflowX: "auto", WebkitOverflowScrolling: "touch",
            }} className="wada-vitrine-scroll">
              {marquesEnPromo.map((m) => (
                <li key={m} style={{
                  fontFamily: fontHeading, fontSize: 14, color: ink,
                  letterSpacing: ".04em", textTransform: "uppercase",
                  whiteSpace: "nowrap", flexShrink: 0, opacity: .85,
                }}>
                  {m}
                </li>
              ))}
            </ul>
          </div>

          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 12, marginTop: 12,
          }}>
            <button
              type="button"
              onClick={() => router.push(`/vetements?onSale=1${genre ? `&genre=${genre}` : ""}`)}
              style={{
                padding: "9px 18px", borderRadius: 999, border: "none",
                background: mojo, color: "#fff", cursor: "pointer",
                fontFamily: fontBody, fontSize: 13, whiteSpace: "nowrap",
              }}
            >
              Découvrir
            </button>
            <button
              type="button"
              onClick={() => router.push(`/marques${genre ? `?genre=${genre}` : ""}`)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: "none", border: "none", padding: 0, cursor: "pointer",
                fontFamily: fontBody, fontSize: 13, color: mojo, whiteSpace: "nowrap",
              }}
            >
              Voir tout
              <Fleche />
            </button>
          </div>
        </section>
      )}

      {/* ── Tendances maintenant ────────────────────────────────────────── */}
      {tuiles.length > 0 && (
        <section style={{ margin: "0 0 24px" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 12, margin: "0 0 11px",
          }}>
            <h2 style={{
              fontFamily: fontLabel, fontSize: 11, letterSpacing: ".14em",
              textTransform: "uppercase", color: ink, fontWeight: 600, margin: 0,
            }}>
              Tendances maintenant
            </h2>
            <button
              type="button"
              onClick={() => router.push(`/vetements${genre ? `?genre=${genre}` : ""}`)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: "none", border: "none", padding: 0, cursor: "pointer",
                fontFamily: fontBody, fontSize: 13, color: mojo, whiteSpace: "nowrap",
              }}
            >
              Voir tout
              <Fleche />
            </button>
          </div>

          {/* Rangée qui défile horizontalement — les tuiles gardent une taille
              lisible au lieu de rétrécir à quatre par écran. */}
          <div
            className="wada-vitrine-scroll"
            style={{
              display: "flex", gap: 10, overflowX: "auto",
              WebkitOverflowScrolling: "touch",
              /* Décalage négatif + padding : les tuiles filent jusqu'au bord
                 de l'écran, comme dans les carrousels d'applis marchandes. */
              margin: "0 -5%", padding: "0 5%",
              scrollSnapType: "x proximity",
            }}
          >
            {tuiles.map((t) => (
              <button
                key={t.titre}
                type="button"
                onClick={() => router.push(`/vetements?q=${encodeURIComponent(t.q)}${genre ? `&genre=${genre}` : ""}`)}
                style={{
                  flex: "0 0 auto", width: 148, padding: 0, border: "none",
                  background: "none", cursor: "pointer", textAlign: "left",
                  scrollSnapAlign: "start",
                }}
              >
                <span style={{
                  display: "block", aspectRatio: "4 / 5", borderRadius: 12,
                  overflow: "hidden", background: "#F2EFE9",
                  border: `1px solid ${border}`,
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.image!} alt="" loading="lazy" decoding="async"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </span>
                <span style={{
                  display: "block", marginTop: 8,
                  fontFamily: fontLabel, fontSize: 10.5, letterSpacing: ".08em",
                  textTransform: "uppercase", color: ink, fontWeight: 600,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {t.titre}
                </span>
                <span style={{
                  display: "block", marginTop: 1,
                  fontFamily: fontBody, fontSize: 12, color: textSecondary,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {t.sous}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <style>{`
        .wada-vitrine-scroll { scrollbar-width: none; }
        .wada-vitrine-scroll::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
