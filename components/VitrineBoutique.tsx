"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { DictionaryEntry } from "@/lib/data";
import { getDisplayImageUrl } from "@/lib/image-utils";
import { formatPrixCatalogue } from "@/lib/priceFormat";
import { deltaEHex } from "@/lib/colorDistance";
import { getCartCount } from "@/lib/cart";
import { useLiked } from "@/hooks/useLiked";
import {
  ink, border, textSecondary, mojo,
  fontHeading, fontBody, fontLabel,
} from "@/lib/styles";

/**
 * VitrineBoutique — la page d'accueil de la boutique, section par section.
 *
 * Maquette client 2026-08-23 (« je veux ça »). Dans l'ordre : recherche +
 * panier, onglets, bannière de remises, tendances du moment, palette WADA
 * (avec quatre pièces), nouveautés, sélection été, sport & performance.
 * La barre de réassurance et le catalogue filtrable sont posés par la page.
 *
 * Règle appliquée partout : AUCUN chiffre n'est écrit en dur. Les remises,
 * les prix « dès X € » et les dates viennent du catalogue. Une section dont
 * la donnée manque ne s'affiche pas, plutôt que d'afficher une valeur
 * inventée que le premier clic démentirait.
 *
 * Écart assumé avec la maquette, expliqué à son emplacement : les marques de
 * la bannière sont en typographie, pas en logos — le dépôt ne contient aucun
 * fichier de logo de marque, et redessiner des marques déposées serait à la
 * fois approximatif et juridiquement douteux.
 *
 * Toutes les données viennent de DEUX requêtes lancées en parallèle. Empiler
 * des appels séquentiels sur une route qui balaie le KV est exactement ce qui
 * coûtait cinq secondes d'attente sur /ma-tenue.
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
  devise?: string;
  urlProduit?: string;
  couleurNom?: string;
  hex?: string;
  description?: string;
  dateMaj?: string;
};

/* ══════════════════════════════════════════════════════════════════════
   PETITES BRIQUES
   ══════════════════════════════════════════════════════════════════════ */

function Fleche({ t = 14 }: { t?: number }) {
  return (
    <svg width={t} height={t} viewBox="0 0 24 24" aria-hidden fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function Coeur({ plein, taille = 18 }: { plein: boolean; taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" aria-hidden
      fill={plein ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 5.6a5.2 5.2 0 0 0-7.4 0L12 7l-1.4-1.4a5.2 5.2 0 1 0-7.4 7.4l1.4 1.4L12 22l7.4-7.6 1.4-1.4a5.2 5.2 0 0 0 0-7.4Z" />
    </svg>
  );
}

/** Rangée qui défile horizontalement, débordant jusqu'aux bords de l'écran. */
function Rangee({ children }: { children: React.ReactNode }) {
  return (
    <div className="wada-vitrine-scroll" style={{
      display: "flex", gap: 10, overflowX: "auto",
      WebkitOverflowScrolling: "touch",
      /* Marge négative + padding : les tuiles filent jusqu'au bord, comme
         dans les carrousels d'applis marchandes, sans casser la gouttière
         de la page. */
      margin: "0 -5%", padding: "0 5% 2px",
      scrollSnapType: "x proximity",
    }}>
      {children}
    </div>
  );
}

function TitreSection({
  titre, href,
}: { titre: string; href?: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 12, margin: "0 0 11px",
    }}>
      <h2 style={{
        fontFamily: fontLabel, fontSize: 11, letterSpacing: ".14em",
        textTransform: "uppercase", color: ink, fontWeight: 600, margin: 0,
      }}>
        {titre}
      </h2>
      {href && (
        <Link href={href} style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          fontFamily: fontBody, fontSize: 13, color: mojo,
          textDecoration: "none", whiteSpace: "nowrap",
        }}>
          Voir tout
          <Fleche />
        </Link>
      )}
    </div>
  );
}

/** Carte produit compacte des carrousels (nouveautés, coups de cœur). */
function CarteProduit({ p }: { p: Produit }) {
  const id = p.id || p.urlProduit || p.nom;
  const [liked, setLiked] = useLiked(id);
  const image = getDisplayImageUrl(p.image, p.largeImage);
  const remise =
    typeof p.prixOriginal === "number" && typeof p.prix === "number" && p.prixOriginal > p.prix
      ? Math.round((1 - p.prix / p.prixOriginal) * 100)
      : null;

  return (
    <article style={{
      position: "relative", flex: "0 0 auto", width: 152,
      background: "#FFFDFA", border: `1px solid ${border}`, borderRadius: 14,
      overflow: "hidden", scrollSnapAlign: "start",
      display: "flex", flexDirection: "column",
    }}>
      <a href={p.urlProduit || "#"} target="_blank" rel="noopener noreferrer sponsored"
        style={{ display: "flex", flexDirection: "column", flex: 1, textDecoration: "none", color: "inherit" }}>
        <span style={{ display: "block", position: "relative", aspectRatio: "1 / 1", background: "#F2EFE9" }}>
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={p.nom} loading="lazy" decoding="async"
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
          {remise !== null && (
            <span style={{
              position: "absolute", top: 7, left: 7, padding: "3px 8px", borderRadius: 999,
              background: "rgba(192,57,43,.12)", color: "#A33529",
              fontFamily: fontLabel, fontSize: 10.5, fontWeight: 600, lineHeight: 1.4,
            }}>
              −{remise}%
            </span>
          )}
        </span>
        <span style={{ display: "flex", flexDirection: "column", gap: 2, padding: "9px 10px 11px", flex: 1 }}>
          {(p.marque || p.marchand) && (
            <span style={{
              fontFamily: fontLabel, fontSize: 10.5, letterSpacing: ".07em",
              textTransform: "uppercase", color: ink, fontWeight: 600,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {p.marque || p.marchand}
            </span>
          )}
          <span style={{
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            overflow: "hidden", minHeight: "2.6em",
            fontFamily: fontBody, fontSize: 12, color: ink, lineHeight: 1.3,
          }}>
            {p.nom}
          </span>
          {typeof p.prix === "number" && (
            <span style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: "auto", paddingTop: 4, flexWrap: "wrap" }}>
              {remise !== null && (
                <span style={{ fontFamily: fontBody, fontSize: 11, color: textSecondary, textDecoration: "line-through" }}>
                  {formatPrixCatalogue(p.prixOriginal, p.devise)}
                </span>
              )}
              <span style={{ fontFamily: fontLabel, fontSize: 13, color: remise !== null ? "#A33529" : ink }}>
                {formatPrixCatalogue(p.prix, p.devise)}
              </span>
            </span>
          )}
        </span>
      </a>
      {/* Hors du lien : un bouton dans un <a> est invalide, et le clic
          partirait chez le marchand au lieu de liker. */}
      <button type="button" onClick={() => setLiked(!liked)} aria-pressed={liked}
        aria-label={liked ? `Retirer ${p.nom} des favoris` : `Ajouter ${p.nom} aux favoris`}
        style={{
          position: "absolute", top: 5, right: 5, width: 30, height: 30,
          borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer",
          color: liked ? mojo : "rgba(30,30,30,.62)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}>
        <Coeur plein={liked} />
      </button>
    </article>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   THÈMES
   ══════════════════════════════════════════════════════════════════════
   Chaque thème sert à DEUX choses : choisir une photo réelle du catalogue
   pour sa vignette, et construire la recherche vers laquelle elle emmène.
   Aucune image n'est stockée : les visuels suivent le catalogue. */

/* `exclut` retire les faux positifs que `motif` attrape par sous-chaîne.
   Mesuré : « T-shirt imprimé » satisfait /shirt/ et se retrouvait en photo ET
   en « dès X € » de la tuile « Chemises ajourées ». Une tuile qui montre un
   t-shirt sous le mot « chemises » est un mensonge de vitrine. */
type Theme = { titre: string; sous: string; q: string; motif: RegExp; exclut?: RegExp };

const TENDANCES: Theme[] = [
  { titre: "Blokecore", sous: "L'esprit football au quotidien", q: "maillot",
    motif: /maillot|jersey|football|track|retro/i },
  { titre: "Lin & naturel", sous: "Matières légères et respirantes", q: "lin",
    motif: /\blin\b|linen|chanvre|coton bio/i },
  { titre: "Sneakers", sous: "Les incontournables du moment", q: "sneakers",
    motif: /sneaker|basket|trainer|running/i },
  { titre: "Graphic tees", sous: "Styles & imprimés qui marquent", q: "t-shirt",
    motif: /t[\s-]?shirt|tee\b|graphic|imprim/i },
];

const SELECTION_ETE: Theme[] = [
  { titre: "Chemises ajourées", sous: "", q: "chemise",
    motif: /chemise|chemisier|shirt/i, exclut: /t[\s-]?shirt|tee[\s-]?shirt|sweat[\s-]?shirt/i },
  { titre: "Ensembles légers", sous: "", q: "ensemble", motif: /ensemble|set\b|coordonn/i },
  { titre: "Shorts", sous: "", q: "short", motif: /short|bermuda/i },
  { titre: "Débardeurs", sous: "", q: "débardeur", motif: /d[ée]bardeur|tank/i },
  { titre: "Accessoires", sous: "", q: "casquette",
    motif: /casquette|\bbobs?\b|lunettes|ceinture|\bsacs?\b|besace/i },
];

const SPORT: Theme[] = [
  { titre: "Running", sous: "", q: "running", motif: /running|course|trail/i },
  { titre: "Training", sous: "", q: "training", motif: /training|gym|fitness|sport/i },
  { titre: "Football", sous: "", q: "football", motif: /football|foot\b|soccer/i },
  { titre: "Outdoor", sous: "", q: "outdoor", motif: /outdoor|randonn|parka|coupe-vent/i },
  { titre: "Basketball", sous: "", q: "basket", motif: /basketball|basket-ball|hoops/i },
];

/* Les onglets de la maquette. Six d'entre eux pointent vers une section
   réellement présente sur la page. « Sneakers » n'en a pas : plutôt que de
   le faire tomber sur une section qui parle d'autre chose — un onglet qui
   ment sur sa destination —, il ouvre la recherche correspondante. */
const ONGLETS: Array<{ label: string; ancre?: string; q?: string }> = [
  { label: "Pour vous", ancre: "pour-vous" },
  { label: "Nouveautés", ancre: "nouveautes" },
  { label: "Tendances", ancre: "tendances" },
  { label: "Été", ancre: "ete" },
  { label: "Sport", ancre: "sport" },
  { label: "Sneakers", q: "sneakers baskets" },
  { label: "Promos", ancre: "offres" },
];

/* ══════════════════════════════════════════════════════════════════════
   COMPOSANT
   ══════════════════════════════════════════════════════════════════════ */

export default function VitrineBoutique({
  genre, palette,
}: {
  genre?: string | null;
  palette?: DictionaryEntry | null;
}) {
  const router = useRouter();
  const [pool, setPool] = useState<Produit[]>([]);
  const [promos, setPromos] = useState<Produit[]>([]);
  /* Page courante de la bannière de remises (4 marques par page). */
  const [pageOffre, setPageOffre] = useState(0);
  const [recherche, setRecherche] = useState("");
  const [panier, setPanier] = useState(0);
  const [ongletActif, setOngletActif] = useState("pour-vous");
  const conteneur = useRef<HTMLDivElement>(null);

  /* Compteur panier — lu au montage puis à chaque écriture d'un autre onglet. */
  useEffect(() => {
    const lire = () => setPanier(getCartCount());
    lire();
    window.addEventListener("storage", lire);
    return () => window.removeEventListener("storage", lire);
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    const g = genre ? `&genre=${encodeURIComponent(genre.toLowerCase())}` : "";
    (async () => {
      try {
        const [rPool, rPromo] = await Promise.all([
          fetch(`/api/products?limit=60${g}`, { signal: ac.signal }),
          fetch(`/api/products?promo=1&limit=40${g}`, { signal: ac.signal }),
        ]);
        if (rPool.ok) {
          const d = await rPool.json();
          setPool(d.products ?? []);
        }
        if (rPromo.ok) setPromos((await rPromo.json()).products ?? []);
      } catch { /* abort ou réseau : la page reste utilisable */ }
    })();
    return () => ac.abort();
  }, [genre]);

  const achetables = useMemo(
    () => pool.filter((p) => (p.image || p.largeImage) && p.urlProduit),
    [pool],
  );

  /* ── Nouveautés : tri par date marchand (cf. `dateMaj`). Les produits sans
     date passent en dernier au lieu d'être classés au hasard. */
  const nouveautes = useMemo(() => {
    return [...achetables].sort((a, b) => {
      const ta = a.dateMaj ? Date.parse(a.dateMaj) : NaN;
      const tb = b.dateMaj ? Date.parse(b.dateMaj) : NaN;
      if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
      if (Number.isNaN(ta)) return 1;
      if (Number.isNaN(tb)) return -1;
      return tb - ta;
    }).slice(0, 10);
  }, [achetables]);

  /* ── Coups de cœur : les pièces les plus proches de la palette du jour.
     La maquette dit « Les plus aimés », mais AUCUNE donnée de popularité
     n'existe (`popularite` n'est renseigné par aucun flux). Renommer était
     plus honnête que de trier au hasard sous un titre qui promet une
     préférence collective. Le critère retenu — la proximité couleur — est
     calculé, vérifiable, et c'est la promesse de WADA. */
  const coupsDeCoeur = useMemo(() => {
    const couleurs = palette?.colors ?? [];
    if (couleurs.length === 0) return achetables.slice(0, 10);
    return [...achetables]
      .map((p) => {
        let ecart = Infinity;
        for (const c of couleurs) {
          try { ecart = Math.min(ecart, deltaEHex(p.hex || "", c.hex)); } catch { /* hex illisible */ }
        }
        return { p, ecart };
      })
      .filter((x) => Number.isFinite(x.ecart))
      .sort((a, b) => a.ecart - b.ecart)
      .slice(0, 10)
      .map((x) => x.p);
  }, [achetables, palette]);

  /* ── Tuiles thématiques : photo réelle + prix mini réel. */
  const tuiles = (themes: Theme[]) =>
    themes.map((t) => {
      const correspondants = achetables.filter((p) => {
        const texte = `${p.nom} ${p.description ?? ""}`;
        return t.motif.test(texte) && !(t.exclut && t.exclut.test(texte));
      });
      const prixMini = correspondants.reduce(
        (min, p) => (typeof p.prix === "number" && p.prix < min ? p.prix : min),
        Infinity,
      );
      const source = correspondants[0];
      return {
        ...t,
        image: source ? getDisplayImageUrl(source.image, source.largeImage) : null,
        prixMini: Number.isFinite(prixMini) ? prixMini : null,
        devise: source?.devise,
      };
    }).filter((t) => t.image);

  const tendances = useMemo(() => tuiles(TENDANCES), [achetables]);
  const ete = useMemo(() => tuiles(SELECTION_ETE), [achetables]);
  const sport = useMemo(() => tuiles(SPORT), [achetables]);

  /* ── Offres par marque : remise MAXIMALE réellement constatée, marque par
     marque. Rien n'est écrit en dur — une marque sans article soldé
     n'apparaît pas. */
  const offres = useMemo(() => {
    const parMarque = new Map<string, number>();
    for (const p of promos) {
      const m = (p.marque || p.marchand || "").trim();
      if (!m || typeof p.prix !== "number" || typeof p.prixOriginal !== "number") continue;
      if (p.prixOriginal <= p.prix) continue;
      const pc = Math.round((1 - p.prix / p.prixOriginal) * 100);
      parMarque.set(m, Math.max(parMarque.get(m) ?? 0, pc));
    }
    return [...parMarque.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([marque, pc]) => ({ marque, pc }));
  }, [promos]);

  /* Bannière de remises : la maquette montre quatre marques et un « JUSQU'À
     −30 % ». Les deux sont calculés — le pourcentage est la remise la plus
     forte réellement constatée, pas un chiffre d'illustration. Sans article
     soldé dans le catalogue, la bannière ne s'affiche pas du tout. */
  const PAR_PAGE = 4;
  const pagesOffres = Math.max(1, Math.ceil(offres.length / PAR_PAGE));
  const pageOffreSure = pageOffre % pagesOffres;
  const offresPage = offres.slice(pageOffreSure * PAR_PAGE, pageOffreSure * PAR_PAGE + PAR_PAGE);
  const remiseMax = offres.length ? offres[0].pc : 0;

  /* Quatre pièces de la palette du jour, pour illustrer le bloc palette. Ce
     sont les plus proches de ses teintes — le même critère que le catalogue,
     pas un échantillon au hasard. */
  const piecesPalette = useMemo(() => {
    const couleurs = palette?.colors ?? [];
    if (couleurs.length === 0) return [];
    return [...achetables]
      .map((p) => {
        let ecart = Infinity;
        for (const c of couleurs) {
          try { ecart = Math.min(ecart, deltaEHex(p.hex || "", c.hex)); } catch { /* hex illisible */ }
        }
        return { p, ecart };
      })
      .filter((x) => Number.isFinite(x.ecart))
      .sort((a, b) => a.ecart - b.ecart)
      .slice(0, 4)
      .map((x) => x.p);
  }, [achetables, palette]);

  const lienGenre = genre ? `&genre=${genre}` : "";
  const versRecherche = (q: string) => `/vetements?q=${encodeURIComponent(q)}${lienGenre}`;

  const allerA = (ancre: string) => {
    setOngletActif(ancre);
    /* `#pour-vous` est l'id du conteneur lui-même : un querySelector interne
       ne le trouve jamais. On teste donc le conteneur avant ses descendants. */
    const racine = conteneur.current;
    const el = racine?.id === ancre ? racine : racine?.querySelector(`#${ancre}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div ref={conteneur} style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }} id="pour-vous">
      {/* ── Recherche + panier ─────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 14px" }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const q = recherche.trim();
            if (q) router.push(versRecherche(q));
          }}
          style={{
            flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 9,
            background: "#FFFDFA", border: `1px solid ${border}`, borderRadius: 14,
            padding: "11px 14px",
          }}
        >
          <span aria-hidden style={{ color: textSecondary, display: "inline-flex", flexShrink: 0 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
          </span>
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher une pièce, une marque…"
            aria-label="Rechercher"
            style={{
              flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none",
              fontFamily: fontBody, fontSize: 14, color: ink,
            }}
          />
        </form>
        <Link href="/panier" aria-label={`Panier — ${panier} article${panier > 1 ? "s" : ""}`}
          style={{
            position: "relative", width: 44, height: 44, borderRadius: 13, flexShrink: 0,
            border: `1px solid ${border}`, background: "#FFFDFA", color: ink,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            textDecoration: "none",
          }}>
          <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor"
            strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 8h16l-1 12H5L4 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" />
          </svg>
          {panier > 0 && (
            <span style={{
              position: "absolute", top: -5, right: -5, minWidth: 19, height: 19,
              borderRadius: 999, background: mojo, color: "#fff",
              fontFamily: fontLabel, fontSize: 11, lineHeight: "19px", textAlign: "center",
              padding: "0 5px",
            }}>
              {panier}
            </span>
          )}
        </Link>
      </div>

      {/* ── Onglets ────────────────────────────────────────────────────── */}
      <nav aria-label="Sections" className="wada-vitrine-scroll" style={{
        display: "flex", gap: 20, overflowX: "auto", WebkitOverflowScrolling: "touch",
        borderBottom: `1px solid ${border}`, margin: "0 -5% 20px", padding: "0 5%",
      }}>
        {ONGLETS.map((o) => {
          const actif = !!o.ancre && ongletActif === o.ancre;
          return (
            <button key={o.label} type="button"
              onClick={() => (o.ancre ? allerA(o.ancre) : router.push(versRecherche(o.q!)))}
              aria-current={actif ? "true" : undefined}
              style={{
                background: "none", border: "none", padding: "0 0 10px", cursor: "pointer",
                whiteSpace: "nowrap", flexShrink: 0, marginBottom: -1,
                fontFamily: fontBody, fontSize: 14,
                color: actif ? mojo : textSecondary, fontWeight: actif ? 600 : 400,
                borderBottom: `2px solid ${actif ? mojo : "transparent"}`,
              }}>
              {o.label}
            </button>
          );
        })}
      </nav>

      {/* ── Bannière remises ────────────────────────────────────────────
          Premier bloc sous les onglets (maquette client 2026-08-23). Elle
          remplace la section « Offres de nos marques », qui vivait six écrans
          plus bas : une remise annoncée après six écrans n'attire personne. */}
      {offres.length > 0 && (
        <section id="offres" style={{
          margin: "0 0 24px", padding: "16px 15px", borderRadius: 16,
          border: `1px solid ${border}`, background: "#FFFDFA",
          display: "flex", alignItems: "center", gap: 14, scrollMarginTop: 16,
        }}>
          <div style={{ flex: "0 0 auto", maxWidth: 124 }}>
            <p style={{
              fontFamily: fontLabel, fontSize: 10, letterSpacing: ".14em",
              textTransform: "uppercase", color: textSecondary, margin: 0,
            }}>
              Jusqu&apos;à
            </p>
            <p style={{
              fontFamily: fontHeading, fontSize: 34, color: mojo,
              margin: "2px 0 0", lineHeight: 1,
            }}>
              −{remiseMax}%
            </p>
            <p style={{
              fontFamily: fontBody, fontSize: 12.5, color: textSecondary,
              margin: "5px 0 0", lineHeight: 1.3,
            }}>
              sur une sélection de marques
            </p>
            <Link href={`/vetements?onSale=1${lienGenre}`} style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              marginTop: 11, padding: "9px 18px", borderRadius: 999,
              background: mojo, color: "#fff", textDecoration: "none",
              fontFamily: fontBody, fontSize: 13,
            }}>
              Découvrir
            </Link>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* MARQUES EN TYPOGRAPHIE, PAS EN LOGOS.
                La maquette montre les logos Carhartt, New Balance, adidas et
                Nike. Le dépôt ne contient aucun fichier de logo de marque, et
                redessiner des marques déposées serait à la fois approximatif
                et juridiquement douteux. Chaque nom est ici un vrai lien vers
                les articles soldés de la marque, avec sa remise réelle. Le
                jour où les fichiers officiels sont fournis, ils se glissent
                dans ce bloc sans rien changer d'autre. */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "10px 8px",
            }}>
              {offresPage.map((o) => (
                <button key={o.marque} type="button"
                  onClick={() => router.push(
                    `/vetements?onSale=1&brands=${encodeURIComponent(o.marque)}${lienGenre}`)}
                  style={{
                    background: "none", border: "none", padding: 0, cursor: "pointer",
                    textAlign: "left", minWidth: 0,
                  }}>
                  <span style={{
                    /* Deux lignes plutôt qu'une troncature : « CARHARTT WIP »
                       devenait « CARHART… », ce qui ne nomme plus la marque. */
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    fontFamily: fontHeading, fontSize: 12.5, color: ink,
                    letterSpacing: ".02em", textTransform: "uppercase", lineHeight: 1.15,
                  }}>
                    {o.marque}
                  </span>
                  <span style={{
                    display: "block", fontFamily: fontBody, fontSize: 12, color: mojo,
                  }}>
                    −{o.pc}%
                  </span>
                </button>
              ))}
            </div>

            {pagesOffres > 1 && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 10, marginTop: 12,
              }}>
                <span style={{ display: "flex", alignItems: "center" }}>
                  {Array.from({ length: pagesOffres }, (_, i) => (
                    /* Le point est un <span> interne : globals.css impose
                       `button { min-height: 36px }` sous 768 px, un bouton de
                       7 px sortait donc en 7×36 — une ellipse verticale,
                       mesurée telle quelle. Le bouton conserve sa cible
                       tactile, ce qui est de toute façon souhaitable : sept
                       pixels ne se visent pas au doigt. */
                    <button key={i} type="button"
                      onClick={() => setPageOffre(i)}
                      aria-label={`Page ${i + 1} des marques en promotion`}
                      aria-current={i === pageOffreSure ? "true" : undefined}
                      style={{
                        padding: "0 3px", border: "none", background: "none",
                        cursor: "pointer", lineHeight: 0, flexShrink: 0,
                        display: "inline-flex", alignItems: "center",
                      }}>
                      <span aria-hidden style={{
                        display: "block", width: 7, height: 7, borderRadius: "50%",
                        background: i === pageOffreSure ? mojo : "rgba(30,30,30,.18)",
                      }} />
                    </button>
                  ))}
                </span>
                <button type="button"
                  onClick={() => setPageOffre((n) => n + 1)}
                  aria-label="Marques suivantes"
                  style={{
                    width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                    border: `1px solid ${border}`, background: "#FAF8F4", color: ink,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                  }}>
                  <Fleche t={14} />
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Tendances du moment ────────────────────────────────────────── */}
      {tendances.length > 0 && (
        <section id="tendances" style={{ margin: "0 0 26px", scrollMarginTop: 16 }}>
          <TitreSection titre="Tendances du moment" href={`/vetements${genre ? `?genre=${genre}` : ""}`} />
          <Rangee>
            {tendances.map((t) => (
              <button key={t.titre} type="button" onClick={() => router.push(versRecherche(t.q))}
                style={{
                  flex: "0 0 auto", width: 158, padding: 0, border: "none", background: "none",
                  cursor: "pointer", textAlign: "left", scrollSnapAlign: "start",
                  position: "relative", borderRadius: 14, overflow: "hidden",
                }}>
                <span style={{ display: "block", aspectRatio: "4 / 5", background: "#E7E2D9" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.image!} alt="" loading="lazy" decoding="async"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </span>
                {/* Voile sombre : le titre est en blanc PAR-DESSUS la photo, il
                    doit rester lisible quelle que soit l'image du catalogue. */}
                <span aria-hidden style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(180deg, rgba(20,16,12,.05) 40%, rgba(20,16,12,.72) 100%)",
                }} />
                {/* Pastille « › » de la maquette : elle signale que la tuile
                    ouvre une sélection, pas qu'elle est une simple image. */}
                <span aria-hidden style={{
                  position: "absolute", right: 10, bottom: 10,
                  width: 26, height: 26, borderRadius: "50%",
                  background: "rgba(255,255,255,.92)", color: ink,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Fleche t={13} />
                </span>
                <span style={{ position: "absolute", left: 11, right: 11, bottom: 11 }}>
                  {/* Le titre prend toute la largeur ; seule la description
                      s'écarte de la pastille. Réserver la place du rond sur
                      les deux faisait passer « LIN & NATUREL » sur deux
                      lignes. */}
                  <span style={{
                    display: "block", fontFamily: fontHeading, fontSize: 13.5, color: "#fff",
                    letterSpacing: ".03em", textTransform: "uppercase", lineHeight: 1.2,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {t.titre}
                  </span>
                  <span style={{
                    display: "block", marginTop: 3, paddingRight: 32,
                    fontFamily: fontBody, fontSize: 11.5,
                    color: "rgba(255,255,255,.88)", lineHeight: 1.3,
                  }}>
                    {t.sous}
                  </span>
                </span>
              </button>
            ))}
          </Rangee>
        </section>
      )}

      {/* ── Shopper par palette WADA ───────────────────────────────────── */}
      {palette && (
        <section id="palette" style={{ margin: "0 0 26px", scrollMarginTop: 16 }}>
          <TitreSection titre="Shopper par palette WADA" href="/palettes" />
          <div style={{
            display: "flex", gap: 14, alignItems: "stretch",
            background: "#FFFDFA", border: `1px solid ${border}`, borderRadius: 16,
            padding: 12, flexWrap: "wrap",
          }}>
            <span aria-hidden style={{
              display: "flex", width: 84, borderRadius: 10, overflow: "hidden", flexShrink: 0,
            }}>
              {palette.colors.map((c) => (
                <span key={c.hex} style={{ flex: 1, background: c.hex, minHeight: 108 }} />
              ))}
            </span>
            <div style={{ flex: "1 1 180px", minWidth: 0, display: "flex", flexDirection: "column" }}>
              <p style={{ fontFamily: fontHeading, fontSize: 17, color: ink, margin: 0, lineHeight: 1.2 }}>
                {palette.name}
              </p>
              <p style={{
                display: "flex", flexWrap: "wrap", gap: "3px 10px", margin: "6px 0 0",
                fontFamily: fontBody, fontSize: 12.5, color: textSecondary,
              }}>
                {palette.colors.map((c) => (
                  <span key={c.hex} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <span aria-hidden style={{
                      width: 8, height: 8, borderRadius: "50%", background: c.hex,
                      border: `1px solid ${border}`,
                    }} />
                    {c.name}
                  </span>
                ))}
              </p>
              <Link href={`/ma-tenue?palette=${palette.number}`} style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                alignSelf: "flex-start", marginTop: "auto", paddingTop: 0,
                padding: "10px 16px", borderRadius: 999, background: mojo, color: "#fff",
                textDecoration: "none", fontFamily: fontBody, fontSize: 13,
              }}>
                Shopper cette palette
              </Link>
            </div>

            {/* Quatre pièces de la palette (maquette client 2026-08-23). Elles
                montrent ce que l'accord donne PORTÉ, ce que trois bandes de
                couleur ne diront jamais. Ce sont les articles réellement les
                plus proches de ses teintes — même critère que le catalogue. */}
            {piecesPalette.length > 0 && (
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: 6, flex: "1 1 100%", minWidth: 0,
              }}>
                {piecesPalette.map((p, i) => {
                  const img = getDisplayImageUrl(p.image, p.largeImage);
                  return (
                    <a key={p.id || i} href={p.urlProduit || "#"}
                      target="_blank" rel="noopener noreferrer sponsored"
                      title={`${p.marque || p.marchand || ""} — ${p.nom}`}
                      style={{
                        display: "block", aspectRatio: "3 / 4", borderRadius: 10,
                        overflow: "hidden", background: "#F2EFE9",
                        border: `1px solid ${border}`, minWidth: 0,
                      }}>
                      {img && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt={p.nom} loading="lazy" decoding="async"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      )}
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Nouveautés ─────────────────────────────────────────────────── */}
      {nouveautes.length > 0 && (
        <section id="nouveautes" style={{ margin: "0 0 26px", scrollMarginTop: 16 }}>
          <TitreSection titre="Nouveautés" href={`/vetements?sort=nouveau${lienGenre}`} />
          <Rangee>
            {nouveautes.map((p, i) => <CarteProduit key={p.id || i} p={p} />)}
          </Rangee>
        </section>
      )}

      {/* ── Sélection été ──────────────────────────────────────────────── */}
      {ete.length > 0 && (
        <section id="ete" style={{ margin: "0 0 26px", scrollMarginTop: 16 }}>
          <TitreSection titre="Sélection été" href={versRecherche("été")} />
          <Rangee>
            {ete.map((t) => (
              <button key={t.titre} type="button" onClick={() => router.push(versRecherche(t.q))}
                style={{
                  flex: "0 0 auto", width: 132, padding: 0, border: "none", background: "none",
                  cursor: "pointer", textAlign: "left", scrollSnapAlign: "start",
                }}>
                <span style={{
                  display: "block", aspectRatio: "1 / 1", borderRadius: 12, overflow: "hidden",
                  background: "#F2EFE9", border: `1px solid ${border}`,
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.image!} alt="" loading="lazy" decoding="async"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </span>
                <span style={{
                  display: "block", marginTop: 7,
                  fontFamily: fontLabel, fontSize: 10, letterSpacing: ".07em",
                  textTransform: "uppercase", color: ink, fontWeight: 600,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {t.titre}
                </span>
                {/* Prix mini RÉEL du thème, calculé sur les produits trouvés —
                    pas un « dès 49 € » décoratif. */}
                {t.prixMini !== null && (
                  <span style={{
                    display: "block", marginTop: 1,
                    fontFamily: fontBody, fontSize: 12, color: textSecondary,
                  }}>
                    Dès {formatPrixCatalogue(t.prixMini, t.devise)}
                  </span>
                )}
              </button>
            ))}
          </Rangee>
        </section>
      )}

      {/* ── Sport & performance ────────────────────────────────────────── */}
      {sport.length > 0 && (
        <section id="sport" style={{ margin: "0 0 26px", scrollMarginTop: 16 }}>
          <TitreSection titre="Sport & performance" href={versRecherche("sport")} />
          <Rangee>
            {sport.map((t) => (
              <button key={t.titre} type="button" onClick={() => router.push(versRecherche(t.q))}
                style={{
                  flex: "0 0 auto", width: 132, padding: 0, border: "none", background: "none",
                  cursor: "pointer", textAlign: "left", scrollSnapAlign: "start",
                  position: "relative",
                }}>
                {/* La pastille est ancrée DANS l'image (position: relative sur
                    la vignette), pas sur le bouton entier : calée sur la
                    hauteur totale, elle retombait sur le bord de la tuile dès
                    que le libellé changeait de hauteur. */}
                <span style={{
                  display: "block", position: "relative",
                  aspectRatio: "1 / 1", borderRadius: 12, overflow: "hidden",
                  background: "#F2EFE9", border: `1px solid ${border}`,
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.image!} alt="" loading="lazy" decoding="async"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <span aria-hidden style={{
                    position: "absolute", right: 8, bottom: 8,
                    width: 28, height: 28, borderRadius: "50%",
                    background: "rgba(255,255,255,.92)", color: ink,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 2px 8px -4px rgba(30,30,30,.5)",
                  }}>
                    <Fleche t={13} />
                  </span>
                </span>
                <span style={{
                  display: "block", marginTop: 7,
                  fontFamily: fontLabel, fontSize: 10, letterSpacing: ".07em",
                  textTransform: "uppercase", color: ink, fontWeight: 600,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {t.titre}
                </span>
              </button>
            ))}
          </Rangee>
        </section>
      )}

      {/* « Offres de nos marques » et « Coups de cœur WADA » ne sont plus
          ici. La première est remontée tout en haut, en bannière (maquette
          client 2026-08-23) : une remise annoncée après six écrans de
          défilement n'attire plus personne. La seconde ne figure pas dans la
          maquette, et la grille du catalogue juste en dessous remplit déjà ce
          rôle — la garder aurait fait deux listes de produits qui se suivent. */}

      <style>{`
        .wada-vitrine-scroll { scrollbar-width: none; }
        .wada-vitrine-scroll::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
