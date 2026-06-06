import { NextResponse } from "next/server";

/**
 * /api/validate-outfit — Brief 2026-05-31 « Logique IA composer renforcée »
 * Couche 6 : Validation finale par LLM.
 *
 * Filet de sécurité ultime. Même si les filtres serveur (registre, outdoor,
 * couleur, prix) ont laissé passer une tenue absurde, ce LLM la rejette
 * avant affichage.
 *
 * Input : palette (nom + couleurs + registre) + profil + occasion + 5 pièces.
 * Output : { verdict: "COHERENT" | "INCOHERENT", raison?, piece_la_plus_problematique? }
 *
 * Modèle : gpt-4o-mini (~$0.0001/tenue, latence 1-2s).
 *
 * Comportement client (/ma-tenue) :
 *  - COHERENT  → afficher la tenue + badge « ✓ Validée par le styliste WADA »
 *  - INCOHERENT → afficher le message de dégradation gracieuse :
 *    « Pour cette palette précise et votre profil, je n'ai pas trouvé de
 *      tenue à la hauteur dans notre catalogue actuel. On enrichit nos
 *      marques partenaires chaque semaine — revenez bientôt, ou essayez
 *      une autre palette. »
 *  - Sur erreur réseau / LLM : on AFFICHE quand même (fail-open, pas de
 *    régression UX si OpenAI est down).
 */

const SYSTEM_PROMPT_VALIDATOR = `Tu es un styliste senior employé chez WADA. Tu valides chaque tenue avant qu'elle soit montrée au client.

Tes critères stricts :
1. Toutes les pièces appartiennent au MÊME registre stylistique (minimaliste / classique / streetwear / décontracté / avant-garde). Pas de mix outdoor + tailoring, pas d'après-ski + t-shirt léger.
2. MAXIMUM UNE couleur forte dans la tenue ; le reste = neutres assortis à la palette.
3. La tenue respecte la saison annoncée (cohérence vêtement/saison).
4. La tenue est cohérente avec l'occasion.
5. La tenue respecte l'ESPRIT de la palette (son nom et ses couleurs). Une palette « Studio danois » minimaliste ne tolère PAS de Moon Boot ou Barbour matelassé.
6. Aucune pièce ne clashe avec une autre.

Pièges fréquents à détecter (rejet automatique) :
- Moon Boot, après-ski, hiking boots sur tenue mode urbaine → INCOHERENT
- North Face NSE, Patagonia tech, Arc'teryx, GORE-TEX sur tenue minimal/classique → INCOHERENT
- Barbour quilted / heritage country sur tenue minimal scandinave → INCOHERENT
- T-shirt couleur vive (vert flashy, rouge néon, fuchsia) sur palette neutres → INCOHERENT
- Tailoring strict + sneakers tech, ou costume + cargo, ou blazer + jogging → INCOHERENT
- Pièce avec graphique central / slogan provocant / dessin (« Stabbing », « Skull ») sur registre classique/minimal → INCOHERENT
- Doudoune / parka technique + chemise fine en plein été → INCOHERENT

Tu réponds STRICTEMENT en JSON, RIEN d'autre :
{
  "verdict": "COHERENT" | "INCOHERENT",
  "raison": "une phrase courte si INCOHERENT, sinon vide",
  "piece_la_plus_problematique": "slot:type" si INCOHERENT, null sinon
}

Aucun texte hors JSON. Pas de markdown.`;

interface ValidateBody {
  palette?: {
    nom?: string;
    ref?: string;
    couleurs?: string[];      // hex
    registre?: string;        // minimaliste | classique | …
    histoire?: string;        // 1-2 phrases optionnel
  };
  profil?: {
    genre?: string;
    budget?: string;
    style?: string;
  };
  occasion?: string;
  tenue?: Array<{
    slot: string;           // haut | bas | veste | chaussures | accent
    type?: string;
    marque?: string;
    couleur?: string;
    matiere?: string;
    prix_eur?: number;
  }>;
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      /* Fail-open : sans clé, on retourne COHERENT pour ne pas bloquer
         l'UX. Le warning serveur permet à l'admin de réagir. */
      console.warn("[/api/validate-outfit] OPENAI_API_KEY absente — fail-open");
      return NextResponse.json({ verdict: "COHERENT", raison: "", piece_la_plus_problematique: null, _fallback: "no_api_key" });
    }

    const body = await req.json().catch(() => null) as ValidateBody | null;
    if (!body?.tenue || !Array.isArray(body.tenue) || body.tenue.length < 3) {
      return NextResponse.json(
        { verdict: "INCOHERENT", raison: "Tenue incomplète (< 3 pièces).", piece_la_plus_problematique: null },
        { status: 400 },
      );
    }

    /* Validation rapide côté serveur AVANT d'appeler le LLM : si on
       détecte déjà un cas obvious (Moon Boot, NSE, etc.), on rejette
       sans payer l'appel LLM. Économie + latence + cohérence garantie
       même si OpenAI est down. */
    const HARD_REJECT = /\b(moon\s*boot|nse|north\s*face|arc'?teryx|patagonia|barbour|gore[\s-]?tex|after[\s-]?ski|après[\s-]?ski|snow\s+boot|stabbing|puncture|skull|bondage)\b/i;
    for (const p of body.tenue) {
      const hay = `${p.marque || ""} ${p.type || ""}`;
      if (HARD_REJECT.test(hay)) {
        return NextResponse.json({
          verdict: "INCOHERENT",
          raison: `${p.marque || p.type} incompatible avec une tenue mode.`,
          piece_la_plus_problematique: `${p.slot}:${p.marque || p.type}`,
          _source: "hard_reject_local",
        });
      }
    }

    /* Construction du payload utilisateur pour le LLM. Format JSON
       structuré pour faciliter la lecture du modèle. */
    const userMessage = JSON.stringify({
      palette: {
        nom: body.palette?.nom || "Inconnue",
        ref: body.palette?.ref || "—",
        registre: body.palette?.registre || "non précisé",
        couleurs: body.palette?.couleurs || [],
        histoire: body.palette?.histoire || "",
      },
      profil: {
        genre: body.profil?.genre || "non précisé",
        budget: body.profil?.budget || "non précisé",
        style: body.profil?.style || "non précisé",
      },
      occasion: body.occasion || "non précisée",
      tenue: body.tenue.map((p) => ({
        slot: p.slot,
        type: p.type || "—",
        marque: p.marque || "—",
        couleur: p.couleur || "—",
        matiere: p.matiere || "—",
        prix_eur: p.prix_eur ?? null,
      })),
    });

    const t0 = Date.now();
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT_VALIDATOR },
          { role: "user", content: userMessage },
        ],
        response_format: { type: "json_object" },
        max_tokens: 200,
        temperature: 0.1, // déterministe : on veut le même verdict pour la même tenue
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text().catch(() => "");
      console.error("[/api/validate-outfit] OpenAI error", openaiRes.status, errText.slice(0, 200));
      /* Fail-open sur erreur réseau : on affiche la tenue. */
      return NextResponse.json({ verdict: "COHERENT", raison: "", piece_la_plus_problematique: null, _fallback: "openai_error" });
    }

    const json = await openaiRes.json();
    const content: string = json?.choices?.[0]?.message?.content || "";
    let parsed: { verdict?: string; raison?: string; piece_la_plus_problematique?: string | null };
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error("[/api/validate-outfit] JSON parse failed:", content.slice(0, 200));
      /* Fail-open sur parse error. */
      return NextResponse.json({ verdict: "COHERENT", raison: "", piece_la_plus_problematique: null, _fallback: "parse_error" });
    }

    const verdict = parsed.verdict === "INCOHERENT" ? "INCOHERENT" : "COHERENT";
    console.log(
      `[/api/validate-outfit] ${verdict} ${Date.now() - t0}ms palette=${body.palette?.ref || "—"} reason=${parsed.raison || "—"}`,
    );

    return NextResponse.json({
      verdict,
      raison: parsed.raison || "",
      piece_la_plus_problematique: parsed.piece_la_plus_problematique || null,
    }, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (err) {
    console.error("[/api/validate-outfit] unexpected error:", err);
    /* Fail-open. */
    return NextResponse.json({ verdict: "COHERENT", raison: "", piece_la_plus_problematique: null, _fallback: "server_error" }, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  }
}
