/**
 * GET /api/palettes/popular — top 10 accords Sanzō Wada pour le filtre
 * Palette vedette de la sidebar catégorie (brief 2026-06-09).
 *
 * « Populaire » = sélection éditoriale stable (premières entrées du
 * dictionnaire, palettes reconnaissables). Pas de tracking de popularité
 * réel pour l'instant → liste figée mais représentative.
 *
 * Réponse : [{ id, name, colors: string[] (hex), culture }]
 */
import { dictionary } from "@/lib/data";

export const runtime = "nodejs";
export const revalidate = 86400; // 24h — le dictionnaire ne bouge pas

export async function GET() {
  const popular = dictionary.slice(0, 10).map((d) => ({
    id: d.number,
    name: d.name,
    colors: d.colors.map((c) => c.hex),
    culture: d.culture || null,
  }));
  return Response.json(popular);
}
