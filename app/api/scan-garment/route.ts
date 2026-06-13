import { NextResponse } from "next/server";

/**
 * /api/scan-garment — Brief 2026-05-31 « Scanner vêtement intelligent » Phase 1.
 *
 * Reçoit une image (data URL base64) capturée par /composer, l'envoie à
 * GPT-4o-mini Vision avec un prompt expert mode, et retourne un JSON
 * structuré : type, marque, modèle, couleur, registre, genre, saison.
 *
 * Cette identification sert ensuite d'ANCRE pour la composition de tenue
 * (Phase 2-3) : on verrouille le slot de la pièce scannée et on compose
 * les 4 autres autour, en respectant son registre et sa palette.
 *
 * Modèle : gpt-4o-mini (~$0.0001 / image, latence 1-3s).
 * Choisi pour : (a) clé déjà dans Vercel, (b) excellente reconnaissance
 * marques mode, (c) coût négligeable jusqu'à 100k scans/mois.
 *
 * Sécurité : la clé OPENAI_API_KEY reste server-side. Aucune image n'est
 * persistée (pas de Blob upload en Phase 1, ajouté en Phase 4).
 */

const SYSTEM_PROMPT_VISION = `Tu es un expert mode chargé d'analyser une photo d'un seul vêtement.
À partir de la photo, identifie :
- type : un mot précis (sneakers, chemise, blazer, jean, pull, robe, bottines, t-shirt, manteau, mocassins, derbies, hoodie, chino, bomber, parka, cardigan, polo, sweat, jogging, short, jupe, manteau long, doudoune, trench, perfecto, surchemise...)
- slot : haut | bas | veste | chaussures | accent
  • haut = t-shirt, chemise, pull, hoodie, polo, sweat, débardeur
  • bas = pantalon, jean, chino, jogging, short, jupe
  • veste = blazer, manteau, parka, doudoune, cardigan, bomber, perfecto, trench, coupe-vent (DOIT avoir manches longues — exclut sleeveless)
  • chaussures = sneakers, derbies, mocassins, bottes, baskets, sandales
  • accent = ceinture, foulard, sac, écharpe, casquette, chapeau
- marque : nom de la marque visible si identifiable (Veja, Nike, MUJI, Levi's, Carhartt, Adidas, COS, Uniqlo, Lacoste, Ralph Lauren, Brunello Cucinelli, Stone Island, Comme des Garçons, Jacquemus, Lemaire...), sinon null
- modele : nom du modèle si reconnaissable (V-10, Campo, 501, Stan Smith, Air Max, Bomber MA-1, ...), sinon null
- couleur_principale : { "nom": "...", "hex": "#RRGGBB" } — nom en français (Bleu marine, Écru, Bordeaux, Vert sapin, Camel, Gris perle, Noir, Blanc cassé, etc.) et hex approximatif
- couleur_secondaire : { "nom": "...", "hex": "#RRGGBB" } si présente, sinon null
- registre : classique | streetwear | minimaliste | decontracte
  • classique = tailoring, costumes, derbies cirés, Brunello, Ralph Lauren, Loro Piana, Zegna
  • streetwear = hoodies, sneakers tech, Stone Island, Off-White, Amiri, Palm Angels, Carhartt
  • minimaliste = lignes nettes sans logo, COS, Lemaire, Jacquemus, Comme des Garçons, Acne
  • decontracte = MUJI, Uniqlo, Armor Lux, basiques sobres sans tailoring
- genre : femme | homme | mixte (mixte si ambigu / unisexe)
- caracteristiques : array de mots-clés courts (low-top, cuir, denim, oversize, cachemire, fluide, structuré, imprimé, motif, brodé, à capuche, à col roulé, ample, ajusté, vintage, etc.)
- saison : ete | mi-saison | hiver | toute_saison

Réponds en JSON STRICT, rien d'autre, pas de markdown :
{
  "type": "...",
  "slot": "...",
  "marque": "..." ou null,
  "modele": "..." ou null,
  "couleur_principale": { "nom": "...", "hex": "#RRGGBB" },
  "couleur_secondaire": { "nom": "...", "hex": "#RRGGBB" } ou null,
  "registre": "...",
  "genre": "...",
  "caracteristiques": ["...", "..."],
  "saison": "..."
}

Si la photo n'est pas un vêtement reconnaissable (chat, café, paysage, écran, etc.), renvoie :
{ "error": "non_reconnu", "raison": "courte description de ce que tu vois" }`;

interface VisionResult {
  type?: string;
  slot?: "haut" | "bas" | "veste" | "chaussures" | "accent";
  marque?: string | null;
  modele?: string | null;
  couleur_principale?: { nom: string; hex: string };
  couleur_secondaire?: { nom: string; hex: string } | null;
  registre?: "classique" | "streetwear" | "minimaliste" | "decontracte";
  genre?: "femme" | "homme" | "mixte";
  caracteristiques?: string[];
  saison?: "ete" | "mi-saison" | "hiver" | "toute_saison";
  error?: string;
  raison?: string;
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "server_misconfigured", raison: "OPENAI_API_KEY absente" },
        { status: 500 },
      );
    }

    const body = await req.json().catch(() => null) as { image?: string } | null;
    const image = body?.image;
    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "bad_request", raison: "Champ `image` (data URL) requis" },
        { status: 400 },
      );
    }

    /* Le client envoie soit une data URL base64 (data:image/jpeg;base64,...)
       soit une URL https (depuis Vercel Blob, ajouté en Phase 4). GPT-4o-mini
       accepte les deux formats via image_url.url. On valide juste le préfixe. */
    if (!/^(data:image\/(jpeg|jpg|png|webp|heic);base64,|https:\/\/)/i.test(image)) {
      return NextResponse.json(
        { error: "bad_request", raison: "Format image invalide (data URL base64 ou https://)" },
        { status: 400 },
      );
    }
    // Limite la taille des données URL pour éviter les DOS
    const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20 MB
    if (image.length > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: "bad_request", raison: "Image trop volumineuse (max 20 MB)" },
        { status: 413 },
      );
    }

    /* Limite garde-fou : ~5 Mo en base64 (≈3.75 Mo réels). Si l'image est
       plus grande, on refuse — le client doit re-compresser. Évite les
       timeouts et les coûts inattendus sur l'API. */
    if (image.startsWith("data:") && image.length > 7_000_000) {
      return NextResponse.json(
        { error: "image_too_large", raison: "Image > 5 Mo — re-compresser" },
        { status: 413 },
      );
    }

    /* Appel GPT-4o-mini Vision. response_format json_object force le modèle
       à retourner du JSON parsable directement. max_tokens 400 suffit
       largement pour la sortie attendue. */
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
          { role: "system", content: SYSTEM_PROMPT_VISION },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyse ce vêtement." },
              { type: "image_url", image_url: { url: image, detail: "low" } },
            ],
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 400,
        temperature: 0.2,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text().catch(() => "");
      console.error("[/api/scan-garment] OpenAI error", openaiRes.status, errText.slice(0, 500));
      return NextResponse.json(
        { error: "vision_failed", raison: `OpenAI HTTP ${openaiRes.status}` },
        { status: 502 },
      );
    }

    const json = await openaiRes.json();
    const content: string = json?.choices?.[0]?.message?.content || "";
    let parsed: VisionResult;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error("[/api/scan-garment] JSON parse failed:", content.slice(0, 300));
      return NextResponse.json(
        { error: "vision_invalid_json", raison: "Sortie LLM non parsable" },
        { status: 502 },
      );
    }

    /* Si la Vision a flagué non_reconnu, on remonte tel quel avec un 200
       (pas une erreur HTTP — c'est un résultat sémantique, pas un bug). */
    if (parsed.error) {
      return NextResponse.json(parsed, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
    }

    /* Validation minimale : le slot DOIT être présent et valide pour que
       le composer puisse l'utiliser. */
    const VALID_SLOTS = ["haut", "bas", "veste", "chaussures", "accent"];
    if (!parsed.slot || !VALID_SLOTS.includes(parsed.slot)) {
      return NextResponse.json(
        { error: "vision_invalid_slot", raison: `Slot inconnu : ${parsed.slot}` },
        { status: 502 },
      );
    }

    /* Logger discret : type + marque + latence — utile pour mesurer la
       qualité du modèle au fil des scans réels. Pas d'image loguée
       (privacy + taille des logs). */
    console.log(
      `[/api/scan-garment] ok ${Date.now() - t0}ms slot=${parsed.slot} type=${parsed.type} marque=${parsed.marque || "—"} registre=${parsed.registre || "—"}`,
    );

    return NextResponse.json(parsed, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (err) {
    console.error("[/api/scan-garment] unexpected error:", err);
    return NextResponse.json(
      { error: "server_error", raison: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}
