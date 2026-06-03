"use client";
/**
 * CategoryNav — Barre de navigation catégories (Bar 2) style Lyst/Net-a-Porter.
 * Brief 2026-06-02 « WADA — Navigation par catégories ».
 *
 * Desktop : méga menu au survol.
 * Mobile : drawer plein-écran avec drill-down.
 */
import { useState, useRef } from "react";
import Link from "next/link";

interface MegaLink { label: string; href: string; badge?: string; }
interface MegaColumn { title: string; links: MegaLink[]; }
interface MegaFooter { text: string; ctaLabel: string; ctaHref: string; }

interface CategoryConfig {
  label: string;
  href: string;
  columns?: MegaColumn[];
  footer?: MegaFooter;
}

export const CATEGORIES: CategoryConfig[] = [
  {
    label: "Vêtements",
    href: "/vetements",
    columns: [
      {
        title: "Hauts",
        links: [
          { label: "Tous les hauts", href: "/vetements/hauts" },
          { label: "T-shirts", href: "/vetements/t-shirts" },
          { label: "Chemises", href: "/vetements/chemises" },
          { label: "Polos", href: "/vetements/polos" },
          { label: "Pulls & cardigans", href: "/vetements/pulls-cardigans" },
          { label: "Sweats & hoodies", href: "/vetements/sweats-hoodies" },
          { label: "Robes", href: "/vetements/robes" },
          { label: "Blouses", href: "/vetements/blouses" },
        ],
      },
      {
        title: "Bas",
        links: [
          { label: "Tous les bas", href: "/vetements/bas" },
          { label: "Pantalons", href: "/vetements/pantalons" },
          { label: "Jeans", href: "/vetements/jeans" },
          { label: "Shorts", href: "/vetements/shorts" },
          { label: "Jupes", href: "/vetements/jupes" },
          { label: "Joggings", href: "/vetements/joggings" },
        ],
      },
      {
        title: "Vestes & manteaux",
        links: [
          { label: "Toutes les vestes", href: "/vetements/vestes" },
          { label: "Blazers", href: "/vetements/blazers" },
          { label: "Manteaux", href: "/vetements/manteaux" },
          { label: "Vestes en jean", href: "/vetements/vestes-jean" },
          { label: "Perfectos & cuir", href: "/vetements/perfectos-cuir" },
          { label: "Trenchs", href: "/vetements/trenchs" },
          { label: "Bombers", href: "/vetements/bombers" },
          { label: "Doudounes", href: "/vetements/doudounes" },
        ],
      },
    ],
    footer: { text: "Filtrable par palette Sanzō Wada", ctaLabel: "Tous les vêtements →", ctaHref: "/vetements" },
  },
  {
    label: "Chaussures",
    href: "/chaussures",
    columns: [
      {
        title: "Casual",
        links: [
          { label: "Toutes les chaussures", href: "/chaussures" },
          { label: "Sneakers", href: "/chaussures/sneakers" },
          { label: "Mocassins", href: "/chaussures/mocassins" },
          { label: "Derbies", href: "/chaussures/derbies" },
          { label: "Sandales", href: "/chaussures/sandales" },
          { label: "Espadrilles", href: "/chaussures/espadrilles" },
        ],
      },
      {
        title: "Formelles & hautes",
        links: [
          { label: "Ballerines", href: "/chaussures/ballerines" },
          { label: "Escarpins", href: "/chaussures/escarpins" },
          { label: "Bottines", href: "/chaussures/bottines" },
          { label: "Bottes", href: "/chaussures/bottes" },
          { label: "Boots de moto", href: "/chaussures/boots-moto" },
        ],
      },
    ],
    footer: { text: "Packshots uniquement", ctaLabel: "Toutes les chaussures →", ctaHref: "/chaussures" },
  },
  {
    label: "Accessoires",
    href: "/accessoires",
    columns: [
      {
        title: "Tête & cou",
        links: [
          { label: "Tous les accessoires", href: "/accessoires" },
          { label: "Foulards & écharpes", href: "/accessoires/foulards" },
          { label: "Chapeaux & bonnets", href: "/accessoires/chapeaux" },
          { label: "Lunettes de soleil", href: "/accessoires/lunettes" },
          { label: "Gants", href: "/accessoires/gants" },
        ],
      },
      {
        title: "Taille & corps",
        links: [
          { label: "Ceintures", href: "/accessoires/ceintures" },
          { label: "Montres", href: "/accessoires/montres" },
          { label: "Portefeuilles", href: "/accessoires/portefeuilles" },
          { label: "Porte-cartes", href: "/accessoires/porte-cartes" },
        ],
      },
    ],
    footer: { text: "Sélection capsule WADA", ctaLabel: "Tous les accessoires →", ctaHref: "/accessoires" },
  },
  {
    label: "Sacs",
    href: "/sacs",
    columns: [
      {
        title: "Femme",
        links: [
          { label: "Tous les sacs", href: "/sacs" },
          { label: "Sacs à main", href: "/sacs/sacs-main" },
          { label: "Sacs à bandoulière", href: "/sacs/sacs-bandouliere" },
          { label: "Pochettes", href: "/sacs/pochettes" },
          { label: "Sacs cabas", href: "/sacs/cabas" },
        ],
      },
      {
        title: "Mixte",
        links: [
          { label: "Sacs à dos", href: "/sacs/sacs-dos" },
          { label: "Sacoche", href: "/sacs/sacoche" },
          { label: "Sacs de voyage", href: "/sacs/sacs-voyage" },
          { label: "Tote bags", href: "/sacs/tote" },
        ],
      },
    ],
    footer: { text: "Filtrable par palette Sanzō Wada", ctaLabel: "Tous les sacs →", ctaHref: "/sacs" },
  },
  {
    label: "Marques",
    href: "/marques",
    columns: [
      {
        title: "Maisons de luxe",
        links: [
          { label: "Brunello Cucinelli", href: "/marques/brunello-cucinelli" },
          { label: "Tom Ford", href: "/marques/tom-ford" },
          { label: "Rick Owens", href: "/marques/rick-owens" },
          { label: "Maison Margiela", href: "/marques/maison-margiela" },
        ],
      },
      {
        title: "Créateurs contemporains",
        links: [
          { label: "AMI Paris", href: "/marques/ami-paris" },
          { label: "Acne Studios", href: "/marques/acne-studios" },
          { label: "Jacquemus", href: "/marques/jacquemus" },
          { label: "Lemaire", href: "/marques/lemaire" },
        ],
      },
      {
        title: "Premium accessible",
        links: [
          { label: "Suitable", href: "/marques/suitable" },
          { label: "Polo Ralph Lauren", href: "/marques/polo-ralph-lauren" },
          { label: "Boss", href: "/marques/boss" },
          { label: "Profuomo", href: "/marques/profuomo" },
        ],
      },
      {
        title: "Lifestyle & basiques",
        links: [
          { label: "MUJI", href: "/marques/muji" },
          { label: "Margaret Howell", href: "/marques/margaret-howell" },
          { label: "Lacoste", href: "/marques/lacoste" },
          { label: "Fred Perry", href: "/marques/fred-perry" },
        ],
      },
    ],
    footer: { text: "Voir toutes les marques", ctaLabel: "Index complet A-Z →", ctaHref: "/marques" },
  },
];

export function CategoryNav() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnter = (label: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setHovered(label);
  };
  const handleLeave = () => {
    timerRef.current = setTimeout(() => setHovered(null), 120);
  };

  const activeCat = CATEGORIES.find((c) => c.label === hovered);

  return (
    <>
      {/* ── Bar 2 Desktop ── */}
      <div
        className="relative hidden md:block"
        onMouseLeave={handleLeave}
        style={{ background: "#faf6ee", borderBottom: "0.5px solid #e8dfd0" }}
      >
        <nav
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 32, padding: "0 28px", height: 44,
          }}
        >
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              onMouseEnter={() => handleEnter(cat.label)}
              style={{
                fontSize: 13, color: "#4a3d2a", textDecoration: "none",
                whiteSpace: "nowrap",
                borderBottom: hovered === cat.label ? "2px solid #6e3b32" : "2px solid transparent",
                paddingBottom: 2,
                transition: "border-color 0.12s",
              }}
            >
              {cat.label}
            </Link>
          ))}
          <Link href="/lettres-du-dimanche" style={{ fontSize: 13, color: "#4a3d2a", textDecoration: "none", whiteSpace: "nowrap" }}>
            Lettres du dimanche
          </Link>
          <Link href="/index-wada" style={{ fontSize: 13, color: "#6e3b32", textDecoration: "none", fontStyle: "italic", whiteSpace: "nowrap" }}>
            Index WADA
          </Link>
        </nav>

        {/* ── Méga menu ── */}
        {hovered && activeCat?.columns && (
          <div
            onMouseEnter={() => handleEnter(hovered)}
            style={{
              position: "absolute", left: 0, right: 0, top: "100%",
              background: "#fff", borderBottom: "1px solid #e8dfd0",
              boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
              zIndex: 200, padding: "28px 40px 20px",
            }}
          >
            <div style={{
              display: "grid",
              gridTemplateColumns: `repeat(${activeCat.columns.length}, 1fr)`,
              gap: 32, maxWidth: 1100, margin: "0 auto",
            }}>
              {activeCat.columns.map((col) => (
                <div key={col.title}>
                  <p style={{
                    fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase",
                    color: "#8a7a68", marginBottom: 12, fontFamily: "'Inter', sans-serif",
                  }}>
                    {col.title}
                  </p>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                    {col.links.map((link) => (
                      <li key={link.href}>
                        <Link href={link.href} style={{ fontSize: 13, color: "#2c2c2a", textDecoration: "none" }}
                          onMouseOver={(e) => (e.currentTarget.style.color = "#6e3b32")}
                          onMouseOut={(e) => (e.currentTarget.style.color = "#2c2c2a")}>
                          {link.label}
                          {link.badge && (
                            <span style={{
                              marginLeft: 6, fontSize: 9, background: "#6e3b32",
                              color: "#f4eee4", padding: "1px 5px", borderRadius: 3,
                            }}>{link.badge}</span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {activeCat.footer && (
              <div style={{
                maxWidth: 1100, margin: "16px auto 0", paddingTop: 14,
                borderTop: "0.5px solid #e8dfd0",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <p style={{ fontSize: 11, color: "#8a7a68", fontStyle: "italic", fontFamily: "'Inter'" }}>
                  {activeCat.footer.text}
                </p>
                <Link href={activeCat.footer.ctaHref} style={{ fontSize: 12, color: "#6e3b32", textDecoration: "underline" }}>
                  {activeCat.footer.ctaLabel}
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Bouton Bar 2 Mobile ── */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="md:hidden"
        style={{
          display: "flex", alignItems: "center", gap: 8,
          width: "100%", padding: "10px 16px",
          background: "#faf6ee", borderBottom: "0.5px solid #e8dfd0",
          fontSize: 13, color: "#4a3d2a", cursor: "pointer", border: "none",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <span style={{ fontSize: 16 }}>☰</span>
        Boutique par catégorie
      </button>

      {/* ── Drawer Mobile ── */}
      {drawerOpen && <CategoryDrawer categories={CATEGORIES} onClose={() => setDrawerOpen(false)} />}
    </>
  );
}

function CategoryDrawer({ categories, onClose }: { categories: CategoryConfig[]; onClose: () => void }) {
  const [level, setLevel] = useState<"top" | "sub">("top");
  const [activeCat, setActiveCat] = useState<string | null>(null);

  const currentCat = categories.find((c) => c.label === activeCat);
  const subLinks = currentCat?.columns?.flatMap((col) => col.links) ?? [];

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#fff", zIndex: 9999,
      display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px", borderBottom: "0.5px solid #e8dfd0",
      }}>
        <button onClick={() => level === "sub" ? setLevel("top") : onClose()}
          style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#4a3d2a" }}>
          {level === "sub" ? "←" : "✕"}
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#2c2c2a", fontFamily: "'Fredoka'" }}>
          {level === "sub" ? activeCat : "Boutique"}
        </span>
        <Link href="/marques" onClick={onClose}
          style={{ fontSize: 12, color: "#6e3b32", textDecoration: "underline", fontFamily: "'Inter'" }}>
          Toutes les marques
        </Link>
      </div>

      {/* Liste */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {level === "top" ? (
          categories.map((cat) => (
            <button key={cat.label}
              onClick={() => { setActiveCat(cat.label); setLevel("sub"); }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", padding: "14px 16px", background: "none", border: "none",
                borderBottom: "0.5px solid #f3ece1", fontSize: 14, color: "#2c2c2a",
                cursor: "pointer", fontFamily: "'Inter'", textAlign: "left",
              }}>
              <span>{cat.label}</span>
              <span style={{ color: "#8a7a68" }}>›</span>
            </button>
          ))
        ) : (
          <>
            {currentCat && (
              <Link href={currentCat.href} onClick={onClose}
                style={{
                  display: "block", padding: "14px 16px", fontSize: 14, fontWeight: 600,
                  color: "#2c2c2a", textDecoration: "none", borderBottom: "0.5px solid #f3ece1",
                  fontFamily: "'Inter'",
                }}>
                Voir tous les {activeCat?.toLowerCase()}
              </Link>
            )}
            {subLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={onClose}
                style={{
                  display: "block", padding: "13px 16px", fontSize: 14,
                  color: "#2c2c2a", textDecoration: "none", borderBottom: "0.5px solid #f3ece1",
                  fontFamily: "'Inter'",
                }}>
                {link.label}
              </Link>
            ))}
          </>
        )}
      </div>

      {/* CTA bas */}
      <div style={{ padding: "12px 16px", borderTop: "0.5px solid #e8dfd0", display: "flex", gap: 8 }}>
        <button onClick={onClose}
          style={{
            flex: 1, padding: "13px 0", background: "none", border: "1px solid #d4ccc0",
            borderRadius: 8, fontSize: 14, color: "#4a3d2a", cursor: "pointer", fontFamily: "'Inter'",
          }}>
          Fermer
        </button>
        <Link href="/palettes" onClick={onClose}
          style={{
            flex: 1, padding: "13px 0", background: "#4a3d2a", borderRadius: 8,
            fontSize: 14, color: "#f4eee4", textAlign: "center", textDecoration: "none",
            fontFamily: "'Fredoka'",
          }}>
          Voir les palettes
        </Link>
      </div>
    </div>
  );
}
