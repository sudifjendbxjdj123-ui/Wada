"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SlotKey } from "@/lib/registreEngine";
import { formatProductPrice } from "@/lib/priceFormat";
import {
  ink, border, textSecondary, mojo,
  fontBody, fontLabel, fontHeading,
} from "@/lib/styles";

/**
 * VariantesTenue — « Variantes de cette tenue » (refonte 2026-08-23, §11).
 *
 * Trois recompositions RÉELLES de la même palette, via le même /api/outfit
 * que la tenue principale : un registre plus décontracté, un plus habillé,
 * et la même direction sous un budget serré. Chaque carte montre les vraies
 * pièces trouvées et leur vrai total — pas une promesse d'illustration.
 *
 * Écart assumé avec la maquette : pas de « WADA Match N % » sur les cartes.
 * Le match se calcule sur la tenue COMPOSÉE (couleurs posées slot par slot,
 * proportions, matières) — refaire ce calcul ici pour trois tenues doublerait
 * le code du composeur côté client ; un pourcentage estimé serait un chiffre
 * décoratif. Le total et les pièces suffisent à choisir ; le match s'affiche
 * en ouvrant la variante.
 *
 * Chargement PARESSEUX : trois compositions = jusqu'à quinze recherches
 * catalogue côté serveur. On ne les déclenche que quand la section approche
 * de l'écran, une seule fois.
 */

type ProduitMini = {
  id?: string; nom: string; prix?: number; devise?: string;
  image?: string; imageLocal?: string; largeImage?: string;
};

type Variante = {
  cle: string;
  titre: string;
  /** Paramètres envoyés à /api/outfit, et répliqués dans le lien. */
  style?: string;
  budgetTotal?: number;
  produits: ProduitMini[];
  total: number;
  devise: string;
};

export default function VariantesTenue({
  slots,
  palette,
  genre,
  styleActuel,
  totalActuel,
}: {
  /** Les slots de la tenue courante — mêmes couleurs, autre registre. */
  slots: Array<{ slot: SlotKey; color: string }>;
  palette: string;
  genre: string | null;
  styleActuel: string | null;
  totalActuel: number;
}) {
  const router = useRouter();
  const conteneur = useRef<HTMLDivElement>(null);
  const lance = useRef(false);
  const [variantes, setVariantes] = useState<Variante[] | null>(null);

  /* Les props lues AU MOMENT du chargement, via une ref : `slots` est un
     tableau recréé à chaque rendu du parent et `totalActuel` bouge pendant
     que les prix se résolvent. En dépendances d'effet, ils détruisaient et
     recréaient l'IntersectionObserver en continu — mesuré : la section
     visible, zéro requête partie. L'observateur ne se crée qu'une fois. */
  const propsRef = useRef({ slots, palette, genre, styleActuel, totalActuel });
  propsRef.current = { slots, palette, genre, styleActuel, totalActuel };

  useEffect(() => {
    const el = conteneur.current;
    if (!el) return;
    const obs = new IntersectionObserver((entrees) => {
      if (!entrees.some((e) => e.isIntersecting) || lance.current) return;
      lance.current = true;
      obs.disconnect();

      const { slots, palette, genre, styleActuel, totalActuel } = propsRef.current;
      /* Les deux registres proposés évitent celui déjà affiché : proposer
         « plus décontracté » à une tenue déjà Décontractée serait la même
         tenue sous un autre nom. */
      const decontracte = styleActuel === "Décontracté" ? "Streetwear" : "Décontracté";
      const habille = styleActuel === "Old money" ? "Classique" : "Old money";
      const demandes: Array<Omit<Variante, "produits" | "total" | "devise">> = [
        { cle: "casual", titre: "Plus décontractée", style: decontracte },
        { cle: "chic", titre: "Plus habillée", style: habille },
        {
          cle: "eco", titre: "Moins chère", style: styleActuel || undefined,
          /* 60 % du total courant : assez serré pour changer les pièces,
             assez large pour rester une tenue complète. */
          budgetTotal: totalActuel > 0 ? Math.round(totalActuel * 0.6) : undefined,
        },
      ];

      (async () => {
        const resultats = await Promise.all(demandes.map(async (d) => {
          try {
            const r = await fetch("/api/outfit", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                slots: slots.map((s) => ({
                  slot: s.slot, color: s.color,
                  seed: `${palette}-${s.slot}-${d.cle}`,
                })),
                palette,
                genre: genre || undefined,
                style: d.style,
                budgetTotal: d.budgetTotal,
              }),
            });
            if (!r.ok) return null;
            const data: { slots?: Array<{ slot: string; product: ProduitMini | null }> } = await r.json();
            const produits = (data.slots ?? [])
              .map((s) => s.product)
              .filter((p): p is ProduitMini => !!p);
            /* Une variante à moins de 3 pièces n'est pas une tenue : on ne
               la montre pas plutôt que d'afficher un look troué. */
            if (produits.length < 3) return null;
            const total = produits.reduce((a, p) => a + (p.prix || 0), 0);
            return {
              ...d, produits, total,
              devise: produits[0]?.devise || "EUR",
            } as Variante;
          } catch { return null; }
        }));
        setVariantes(resultats.filter((v): v is Variante => !!v));
      })();
    }, { rootMargin: "400px" });
    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const voirLook = (v: Variante) => {
    const sp = new URLSearchParams({ palette });
    if (v.style) sp.set("style", v.style);
    if (genre) sp.set("genre", genre);
    router.push(`/ma-tenue?${sp}`);
    /* Le style de la variante doit survivre au rechargement de la page —
       c'est lui que le composeur lit en priorité via l'URL. */
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* Rien à montrer tant que rien n'est chargé — la section n'existe qu'une
     fois les variantes réelles connues, pas de squelette permanent. */
  if (variantes !== null && variantes.length === 0) return null;

  return (
    <div ref={conteneur} style={{ maxWidth: 980, margin: "0 auto" }}>
      <p style={{
        fontFamily: fontLabel, fontSize: 10.5, letterSpacing: ".14em",
        textTransform: "uppercase", color: ink, fontWeight: 600,
        margin: "0 0 10px",
      }}>
        Variantes de cette tenue
      </p>
      <div className="wada-tabs-scroll" style={{
        display: "flex", gap: 10, overflowX: "auto",
        WebkitOverflowScrolling: "touch", scrollSnapType: "x proximity",
        margin: "0 -5%", padding: "0 5% 2px",
      }}>
        {(variantes ?? [null, null, null]).map((v, i) => (
          <div key={v?.cle ?? i} style={{
            flex: "0 0 auto", width: 240, scrollSnapAlign: "start",
            background: "#FFFDFA", border: `1px solid ${border}`, borderRadius: 16,
            padding: 12, display: "flex", flexDirection: "column", gap: 10,
          }}>
            {v ? (
              <>
                <span style={{ fontFamily: fontHeading, fontSize: 15, color: ink }}>
                  {v.titre}
                </span>
                <span style={{
                  display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 5,
                }}>
                  {v.produits.slice(0, 4).map((p, j) => {
                    const img = p.imageLocal || p.largeImage || p.image || null;
                    return (
                      <span key={p.id ?? j} style={{
                        display: "block", aspectRatio: "3 / 4", borderRadius: 8,
                        overflow: "hidden", background: "#fff",
                        border: `1px solid ${border}`,
                      }}>
                        {img && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt={p.nom} loading="lazy" decoding="async"
                            style={{ width: "100%", height: "100%", objectFit: "contain", padding: 2 }} />
                        )}
                      </span>
                    );
                  })}
                </span>
                <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontFamily: fontLabel, fontSize: 14.5, color: ink, fontWeight: 600 }}>
                    {formatProductPrice(Math.round(v.total * 100) / 100, null, v.devise)}
                  </span>
                  <span style={{ fontFamily: fontBody, fontSize: 11.5, color: textSecondary }}>
                    {v.produits.length} pièces
                  </span>
                </span>
                <button type="button" onClick={() => voirLook(v)} style={{
                  padding: "9px 14px", borderRadius: 999,
                  border: `1px solid ${border}`, background: "transparent",
                  cursor: "pointer", fontFamily: fontBody, fontSize: 12.5, color: mojo,
                }}>
                  Voir le look
                </button>
              </>
            ) : (
              <span aria-hidden className="wada-skeleton" style={{
                display: "block", height: 172, borderRadius: 10,
                background: "rgba(30,30,30,.05)",
              }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
