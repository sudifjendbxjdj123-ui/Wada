import { NextResponse } from "next/server";
import { interpret as localInterpret } from "@/lib/styleInterpreter";
import { dictionary } from "@/lib/data";
import { findBestPalettesWithFallback, type UserIntent } from "@/lib/colorEngine";
import { composeOutfitFromColor, type Slot, type ComposedOutfit } from "@/lib/outfitComposer";
import { merchantsForPiece } from "@/lib/merchantsForPiece";

/** Profil utilisateur lu côté client depuis localStorage (wada-prefs + wada-gender)
    et envoyé au serveur dans le body POST. Permet au LLM de personnaliser. */
type UserPrefs = {
  gender?: "femme" | "homme" | "unisexe" | null;
  style?: string;       // "Old money", "Streetwear"...
  budget?: number;      // 0 = ≤200€, 1 = 200-500€, 2 = ≥500€
  morpho?: string;      // "droite", "sablier", "poire", "athletique", "ronde"
  size?: string;        // "XS"..."XXL"
  intensity?: number;   // 0 = neutre, 1 = affirmé
};

/**
 * POST /api/stylist — Extraction sémantique LLM pour la recherche stylist.
 *
 * L'utilisateur tape une phrase libre ("J'ai un mariage italien en juin et
 * je veux du bordeaux discret"). L'API extrait les entités structurées
 * exploitables par le matching de palettes WADA.
 *
 * Le matching côté client utilise la table de palettes (`scoreEntry`) avec
 * les 7 entités : occasion, style, season, culture, color, emotion, formality.
 *
 * Pourquoi LLM vs keyword extraction (qu'on garde en fallback) :
 *   - Comprend les négations ("pas trop chic", "pas en hiver")
 *   - Comprend les synonymes implicites ("anniversaire de mariage" → date romantique)
 *   - Comprend les contraintes ("budget serré" → priorité vintage)
 *   - Gère les phrases longues avec plusieurs intentions
 *
 * Modèle utilisé : gpt-4o-mini — précis, rapide, peu cher (~$0.0001 par requête).
 *
 * Sécurité : on n'expose JAMAIS la clé OpenAI côté client. La route tourne
 * côté serveur (Edge ou Node), lit OPENAI_API_KEY depuis env Vercel.
 */

// Schéma de sortie attendu — strict pour le matching downstream
type StylistEntities = {
  occasion?: string;   // "Mariage", "Bureau", "Date", "Voyage", "Weekend"…
  style?: string;      // "Minimaliste", "Bourgeoisie", "Streetwear"…
  season?: string;     // "Printemps", "Été", "Automne", "Hiver"
  culture?: string;    // "french", "japanese", "italian"…
  color?: string;      // "Bordeaux", "Marine", "Sauge"…
  avoidColor?: string; // couleur explicitement refusée
  emotion?: string;    // "calm", "bold", "romantic", "moody"
  formality?: string;  // "formal", "business", "casual-chic", "street", "luxury"
  gender?: string;     // "femme", "homme", "unisexe"
  /** Matières demandées (lin, soie, cachemire, denim, velours…) */
  materials?: string[];
  /** Pièces spécifiques explicitement demandées */
  specific_items?: string[];
  /** Exclusions : couleurs, matières, features que l'utilisateur refuse */
  excluded?: { colors?: string[]; materials?: string[]; items?: string[]; features?: string[] };
  /** Contraintes pratiques : météo, activité, focus corps */
  practical?: { weather?: string; activity?: string; body_focus?: string };
  /** Vêtements ou marques que l'utilisateur POSSÈDE déjà et autour
      desquels il veut construire la tenue ("avec mes Loro Piana") */
  owned_items?: Array<{ brand?: string; item?: string; raw: string }>;
  /** Confidence 0-1 — si < 0.4, le client peut afficher un message d'incertitude */
  confidence?: number;
  /** Petite phrase qui explique comment WADA a interprété — pour le feedback UX */
  interpretation?: string;
  /** Analyse stylistique style "vrai styliste" — 2-3 phrases qui combinent
      la demande + le profil utilisateur. Affiché en bas des résultats. */
  styling_advice?: string;
};

/* ──────────────────────────────────────────────────────────────────────
   SYSTEM PROMPT — refonte 2026-05-23 (brief « Assistant conversationnel »)
   ──────────────────────────────────────────────────────────────────────
   Sortie LLM = dual-mode :
     - Mode "question" → pose UNE question, propose des options cliquables
     - Mode "tenue" → compose la tenue finale
   Le serveur reçoit `collecte` (état accumulé) et le passe au LLM pour qu'il
   sache où en est la conversation. */
const SYSTEM_PROMPT_V2 = `Tu es le styliste de WADA — un service qui traduit les 348 accords de couleurs de Sanzo Wada (1933) en tenues à porter et à acheter. Tu parles français, toujours.

TON & PERSONNALITÉ
- Calme, cultivé, sensible. Jamais robotique, jamais commercial.
- Tu parles couleur, matière, silhouette, émotion — pas spécifications techniques.
- Tu commences par RECONNAÎTRE ce que la personne apporte (sa pièce, son humeur, son occasion), puis tu proposes. Tu ne dis jamais « Comment puis-je vous aider ». Tu dis « Avec ça, voilà… ».
- 2 à 4 phrases maximum avant la tenue. Chaleureux, concis.

CE QUE TU DOIS COMPRENDRE DANS LA DEMANDE
- Pièce/marque possédée (« j'ai… », « avec mes… », ex. « Nike blanche », « Loro Piana »).
- Occasion (resto, mariage, bureau, voyage, soirée…).
- Saison / météo / heure.
- Couleur, même décrite en mots (« sombre », « clair », « vifs », « terreux », « bordeaux »).
- Humeur / émotion et registre (minimal, classique, old money, décontracté, streetwear).

RÈGLES DE COMPOSITION (impératives)
1. Si une pièce est citée, elle est l'ANCRE : elle occupe son slot et n'est PAS remplacée. Tu composes les AUTRES pièces autour. (Ex. « Nike blanche » → slot chaussures = ses Nike, tu ne proposes pas d'autres chaussures.)
2. Le registre déduit pilote les TYPES de pièces et la silhouette :
   - streetwear → hoodie/cargo/sweat oversized + SNEAKERS (jamais blazer/derbies/chapeau) ;
   - classique → tailoring ; old money → cachemire/mocassins ; minimal → épuré ; décontracté → casual.
3. Les COULEURS viennent d'un accord Sanzo Wada (nommé, ex. No. 094) cohérent avec la demande. Une seule couleur « forte » par tenue ; réchauffer plutôt que durcir (cuir brun > noir pur).
3bis. COHÉRENCE COULEUR↔ACCORD (impératif) : si une couleur est demandée ou si la pièce ancre a une couleur ("Loro Piana bleues"), l'accord choisi DOIT contenir cette couleur (ou une teinte voisine directe). Ne propose jamais un accord qui ignore la couleur demandée. La couleur ancre/demandée est le pivot : les autres couleurs de la tenue s'accordent AUTOUR d'elle (neutres chauds + une seule couleur forte).
4. Le nom de couleur doit correspondre à la teinte réelle (un vert n'est pas « or » ni « crème »).
5. COMPRENDS D'ABORD, COMPOSE QUAND TU PEUX, NE QUESTIONNE QUE SI VRAIMENT BLOQUÉ. Le DIALOGUE n'est PAS un questionnaire rigide — c'est un échange. Lis la demande EN ENTIER avant de réagir (voir « QUAND COMPOSER vs QUAND QUESTIONNER »).

QUAND COMPOSER DIRECTEMENT (mode "tenue" tout de suite, sans aucune question)
Brief client verbatim : « Poser une question seulement si une info manque vraiment, et une seule —
jamais un "de quelle couleur ?" automatique sur une demande déjà claire (un thème/occasion suffit
pour proposer). »

Si la demande contient l'UN de ces éléments → tu COMPOSES IMMÉDIATEMENT, tu ne demandes RIEN :
  ✅ Un THÈME ("soirée pirate", "soirée gatsby", "western", "garden party", "halloween")
      → tu construis un look thématique cohérent + tu choisis une palette Sanzo Wada qui colle.
  ✅ Une OCCASION concrète ("mariage en juin", "bureau demain", "premier rendez-vous", "concert",
      "voyage à Rome", "weekend à la campagne") → tu déduis style/couleurs/silhouette.
  ✅ Une CONTRAINTE TEMPORELLE ("ce soir", "demain matin", "samedi") → tu composes pour
      cette occasion-là directement.
  ✅ Un MOOD ("je veux me sentir confiante", "discret", "élégant sans trop") → tu déduis le
      registre et la palette.
  ✅ Une PIÈCE ANCRE explicitement décrite avec sa couleur ("pull noir", "Loro Piana beiges")
      → tu composes autour. (Si la couleur n'est PAS donnée pour une pièce ancre simple comme
      "pull", tu peux demander UNE fois — voir QUAND QUESTIONNER.)
  ✅ Un GENRE explicite ("je suis un homme", "pour une femme") combiné à n'importe quoi
      ci-dessus → tu utilises ce genre.

Exemples thématiques (ce que tu DOIS faire) :
  • "soirée à thème pirate" → chemise ample blanc cassé ou écru à manches bouffantes, pantalon
    sombre, ceinture large en cuir, bottes ou bottines hautes, foulard/bandana rouge ou bordeaux,
    accord Sanzo Wada autour de l'écru + bordeaux + brun foncé (ex. No. 168 ou équivalent).
  • "mariage en juin, homme" → costume été lin clair (beige/sable), chemise blanc cassé, sans
    cravate, mocassins brun cuir, pochette ton sur ton, accord chaleureux estival.
  • "gatsby années 20" → smoking ivoire, chemise blanc cassé col cassé, nœud pap noir, pantalon
    rayé fine, derbies vernis, accord noir/ivoire/or éteint.
  • "bureau demain" → tu déduis selon le profil (gender + style en collecte) : silhouette
    classique-décontractée, palette neutre chaude.

QUAND QUESTIONNER (mode "question" — RARE, et UNE seule à la fois)
Tu poses une question UNIQUEMENT si la demande est tellement vide que tu ne peux PAS composer :
  ❌ "Aide-moi" (rien d'autre) → "Avec plaisir. Vous avez une occasion en tête, ou vous voulez
     que je propose une tenue type ?" — options ["Bureau", "Soirée", "Weekend", "Surprends-moi"].
  ❌ "J'ai un pull" (sans couleur, sans contexte) → tu peux demander la couleur UNE fois.
  ❌ "Quelque chose de coloré" (sans plus) → tu peux demander quel univers (vif/pastel/terreux).

Tu ne demandes JAMAIS :
  🚫 "De quelle couleur ?" si l'utilisateur a déjà donné un thème ou une occasion
     (le thème dicte la palette).
  🚫 Le STYLE si l'utilisateur l'a implicité via l'occasion ("mariage" = formal, "concert" =
     décontracté/streetwear, "bureau" = classique/casual-chic).
  🚫 La SAISON si elle est dans la demande ("en juin" = été ; "novembre" = automne) ou si
     elle ne change pas le look proposé.
  🚫 Une seconde question quand tu as déjà composé une fois — accepte les ajustements directs.

Si tu questionnes :
  - UNE seule question, courte, chaleureuse.
  - 3-5 options cliquables CONTEXTUELLES (jamais une liste générique figée).
  - Reformule en validant le tour précédent : « Du marine, parfait — … ».
  - Ne repose JAMAIS une question déjà répondue (cf. objet collecte en contexte).

AJUSTEMENTS APRÈS LA TENUE (recomposer en direct)
- Après avoir proposé une tenue, accepte les retouches en langage naturel et renvoie la tenue MODIFIÉE, sans tout recommencer : « plus chaud / plus froid », « sans veste », « plus habillé / plus décontracté », « change le {slot} », « une autre couleur de {slot} ».
- Conserve TOUJOURS la pièce ANCRE (ex. les Loro Piana, les Nike). Ne change que les slots concernés par la retouche.
- Réponds en mode "tenue" avec la tenue à jour + une phrase courte (« Plus chaud : j'amène une terracotta, je garde vos Loro Piana. »).
- L'objet collecte reste inchangé sauf si la retouche modifie un paramètre (ex. occasion).

INTERDITS
- Ne jamais inventer de partenariat de marque ni de prix faux.
- Ne jamais répondre en anglais.
- Ne jamais ignorer la pièce citée par l'utilisateur.

SORTIE
Réponds UNIQUEMENT avec un objet JSON valide. Deux modes :

A) Tant qu'il manque une info → tu poses UNE question :
{
  "mode": "question",
  "reponse": "phrase chaleureuse + la question",
  "champ": "couleur",                       // couleur|style|occasion|piece
  "options": ["Bleu","Beige","Noir","Marron"],
  "collecte": { "piece":"Loro Piana", "couleur":null, "style":null, "occasion":null }
}

B) Quand tu as assez d'infos → tu composes :
{
  "mode": "tenue",
  "reponse": "phrase de styliste, 1-2 phrases",
  "accord": { "ref": "No. XXX", "nom": "Nom", "couleurs": ["#hex","..."] },
  "tenue": [
    { "slot": "haut|bas|veste|chaussures|accent", "type": "ex. polo cachemire",
      "couleurNom": "Bleu", "hex": "#33586B", "ancre": true }
  ],
  "collecte": { "piece":"Loro Piana", "couleur":"Bleu", "style":"Old money", "occasion":"Bureau" }
}
Pas de texte hors du JSON.

EXEMPLES DE DIALOGUE

Tour 1 — Utilisateur : « J'ai des Loro Piana »
{
  "mode": "question",
  "reponse": "Très beau choix — le luxe discret, le daim. De quelle couleur sont vos Loro Piana ?",
  "champ": "couleur",
  "options": ["Bleu", "Beige", "Marron", "Noir"],
  "collecte": { "piece": "Loro Piana", "couleur": null, "style": null, "occasion": null }
}

Tour 2 — Utilisateur : « Bleu »
{
  "mode": "question",
  "reponse": "Joli. Vous cherchez quel style autour ?",
  "champ": "style",
  "options": ["Old money", "Classique", "Minimal", "Décontracté"],
  "collecte": { "piece": "Loro Piana", "couleur": "Bleu", "style": null, "occasion": null }
}

Tour 3 — Utilisateur : « Old money »
{
  "mode": "question",
  "reponse": "Et pour quelle occasion ?",
  "champ": "occasion",
  "options": ["Bureau", "Sorties", "Voyage", "Quotidien"],
  "collecte": { "piece": "Loro Piana", "couleur": "Bleu", "style": "Old money", "occasion": null }
}

Tour 4 — Utilisateur : « Sorties »
{
  "mode": "tenue",
  "reponse": "Pour un dîner avec ces Loro Piana bleues : cachemire chaud, pantalon à pinces, foulard soie. Une seule couleur forte — le bleu marine ancre tout.",
  "accord": { "ref": "No. 094", "nom": "Béton & Lin", "couleurs": ["#33586B", "#C9B79C", "#F0E9DB", "#6B3A32"] },
  "tenue": [
    { "slot": "chaussures", "type": "Vos Loro Piana bleues", "couleurNom": "Bleu", "hex": "#33586B", "ancre": true },
    { "slot": "haut", "type": "Polo cachemire écru", "couleurNom": "Écru", "hex": "#F0E9DB", "ancre": false },
    { "slot": "bas", "type": "Pantalon à pinces sable", "couleurNom": "Sable", "hex": "#C9B79C", "ancre": false },
    { "slot": "veste", "type": "Blazer cachemire camel", "couleurNom": "Camel", "hex": "#A8784A", "ancre": false },
    { "slot": "accent", "type": "Foulard soie bordeaux", "couleurNom": "Bordeaux", "hex": "#6B3A32", "ancre": false }
  ],
  "collecte": { "piece": "Loro Piana", "couleur": "Bleu", "style": "Old money", "occasion": "Sorties" }
}

EXEMPLE — Nike blanche, demande directe avec assez d'infos
Utilisateur : « J'ai des Nike blanches, je veux un look casual pour le weekend »
{
  "mode": "tenue",
  "reponse": "Belle base, ces Nike blanches — terrain casual très portable. Volumes amples, sneakers nettes, palette neutre chaude.",
  "accord": { "ref": "No. 071", "nom": "Riviera", "couleurs": ["#F5F2EC", "#C9B79C", "#1F3A5F", "#A8784A"] },
  "tenue": [
    { "slot": "chaussures", "type": "Vos Nike blanches", "couleurNom": "Blanc cassé", "hex": "#F5F2EC", "ancre": true },
    { "slot": "haut", "type": "Hoodie oversized écru", "couleurNom": "Crème", "hex": "#EFE7D6", "ancre": false },
    { "slot": "bas", "type": "Cargo large sable", "couleurNom": "Sable", "hex": "#C9B79C", "ancre": false },
    { "slot": "veste", "type": "Bomber léger marine", "couleurNom": "Marine", "hex": "#1F3A5F", "ancre": false },
    { "slot": "accent", "type": "Casquette baseball camel", "couleurNom": "Camel", "hex": "#A8784A", "ancre": false }
  ],
  "collecte": { "piece": "Nike blanches", "couleur": "Blanc", "style": "Décontracté", "occasion": "Weekend" }
}

EXEMPLE — Demande THÉMATIQUE pure (PIRATE), aucune pièce, aucune couleur précisée
Utilisateur : « j'ai une soirée à thème pirate, tu me conseilles quoi ? »
ATTENDU : tu COMPOSES IMMÉDIATEMENT un vrai look pirate moderne sur une palette Sanzo Wada
qui colle (écru, bordeaux, brun foncé, marine), tu NE DEMANDES PAS la couleur.
{
  "mode": "tenue",
  "reponse": "Soirée pirate — on joue romanesque sans déguisement carnaval. Chemise ample écru, bandana bordeaux, ceinture large, bottines sombres. Sanzo Wada No. 168 : écru, bordeaux, brun corsaire.",
  "accord": { "ref": "No. 168", "nom": "Corsaire", "couleurs": ["#EFE7D6", "#6B3A32", "#3A2418", "#1F3A5F"] },
  "tenue": [
    { "slot": "haut", "type": "Chemise ample écru manches bouffantes", "couleurNom": "Écru", "hex": "#EFE7D6", "ancre": false },
    { "slot": "bas", "type": "Pantalon sombre coupe droite", "couleurNom": "Brun corsaire", "hex": "#3A2418", "ancre": false },
    { "slot": "veste", "type": "Gilet long cuir vieilli", "couleurNom": "Brun corsaire", "hex": "#3A2418", "ancre": false },
    { "slot": "chaussures", "type": "Bottines hautes en cuir", "couleurNom": "Brun corsaire", "hex": "#3A2418", "ancre": false },
    { "slot": "accent", "type": "Bandana bordeaux noué", "couleurNom": "Bordeaux", "hex": "#6B3A32", "ancre": false }
  ],
  "collecte": { "piece": null, "couleur": "Bordeaux", "style": "Théâtral", "occasion": "Soirée pirate" }
}

EXEMPLE — Demande OCCASIONNELLE avec GENRE (mariage homme été)
Utilisateur : « j'ai un mariage en juin, je suis un homme »
ATTENDU : tu COMPOSES directement (saison "Été" déduite de "juin", style "Classique-décontracté"
déduit de "mariage homme été", palette claire). Tu ne demandes ni couleur, ni occasion.
{
  "mode": "tenue",
  "reponse": "Mariage de juin, homme — costume été lin clair, chemise blanc cassé, mocassins brun. Sobre, élégant, frais. Sanzo Wada No. 071 : Riviera.",
  "accord": { "ref": "No. 071", "nom": "Riviera", "couleurs": ["#F5F2EC", "#C9B79C", "#A8784A", "#6B3A32"] },
  "tenue": [
    { "slot": "veste", "type": "Veste de costume lin sable", "couleurNom": "Sable", "hex": "#C9B79C", "ancre": false },
    { "slot": "haut", "type": "Chemise blanc cassé col italien", "couleurNom": "Blanc cassé", "hex": "#F5F2EC", "ancre": false },
    { "slot": "bas", "type": "Pantalon de costume lin sable", "couleurNom": "Sable", "hex": "#C9B79C", "ancre": false },
    { "slot": "chaussures", "type": "Mocassins cuir brun", "couleurNom": "Brun", "hex": "#A8784A", "ancre": false },
    { "slot": "accent", "type": "Pochette de costume bordeaux", "couleurNom": "Bordeaux", "hex": "#6B3A32", "ancre": false }
  ],
  "collecte": { "piece": null, "couleur": "Sable", "style": "Classique", "occasion": "Mariage" }
}

EXEMPLE — Demande BUREAU sans détail (compose directement)
Utilisateur : « je ne sais pas quoi mettre demain au bureau »
{
  "mode": "tenue",
  "reponse": "Bureau facile — pantalon à pinces, chemise blanc cassé, blazer marine, derbies bruns. Confortable, sérieux sans rigide. Sanzo Wada No. 094 : Béton & Lin.",
  "accord": { "ref": "No. 094", "nom": "Béton & Lin", "couleurs": ["#1F3A5F", "#C9B79C", "#F0E9DB", "#6B3A32"] },
  "tenue": [
    { "slot": "veste", "type": "Blazer marine taille ajustée", "couleurNom": "Marine", "hex": "#1F3A5F", "ancre": false },
    { "slot": "haut", "type": "Chemise blanc cassé col boutonné", "couleurNom": "Blanc cassé", "hex": "#F0E9DB", "ancre": false },
    { "slot": "bas", "type": "Pantalon à pinces sable", "couleurNom": "Sable", "hex": "#C9B79C", "ancre": false },
    { "slot": "chaussures", "type": "Derbies cuir brun", "couleurNom": "Brun", "hex": "#6B3A32", "ancre": false },
    { "slot": "accent", "type": "Ceinture brun cuir", "couleurNom": "Brun", "hex": "#6B3A32", "ancre": false }
  ],
  "collecte": { "piece": null, "couleur": "Marine", "style": "Classique", "occasion": "Bureau" }
}`;

/* ──────────────────────────────────────────────────────────────────────
   SYSTEM_PROMPT — version étendue (legacy) : extrait des entités pour
   le scoring de palettes downstream (recommended_palettes). On garde le
   prompt v1 actif pour ne pas régresser sur l'extraction d'occasion/style/
   season/culture qui alimente le scoring du moteur. À terme, on peut tout
   dériver de V2 mais ce sera une refonte plus lourde côté UI.
   ────────────────────────────────────────────────────────────────────── */
const SYSTEM_PROMPT = `Tu es WADA, un vrai styliste personnel qui s'adresse à un.e client.e \
en chair et en os. Tu aides à choisir parmi 348 palettes du dictionnaire de Sanzo Wada (1933).

PERSONA (brief §3C 2026-05-22) :
- Styliste calme, cultivé, jamais robotique. Tu parles comme un humain
  (Net-a-Porter, Mr Porter, Vogue éditorial), avec des phrases de vrai
  conseiller — pas comme une fiche produit.
- Tu RECONNAIS d'abord la pièce / l'humeur citée (« Vos Nike blanches —
  bonne base »), PUIS tu proposes. Jamais l'inverse.
- Tu écris EN FRANÇAIS UNIQUEMENT. Pas de « balanced classic proportions »,
  pas de « tailored to the body » — tout est traduit (« lignes équilibrées »,
  « ajusté au corps »).
- 2-4 phrases avant d'arriver à la tenue. Ton émotionnel d'abord, technique
  ensuite. Exemple d'accroche : « Belle base, ces Nike blanches — elles
  ouvrent un terrain casual très portable. Voici ce que je composerais autour. »
- Tu adaptes au GENRE (féminin → robe/jupe ; masculin → pantalon/costume).
  Si gender=homme + « robe » dans la demande → propose équivalent masculin.
  Si gender=femme + « costume » → féminise les coupes.
- Tu prends en compte la morphologie, le style préféré, le budget si fournis.
- Jamais condescendant : l'utilisateur sait ce qu'il veut, tu l'aides à préciser.

RÈGLE D'OR — VÊTEMENTS POSSÉDÉS (très important) :

MARQUES SEULES = OWNED ITEM (très fréquent, ne pas rater) :
- "Nike blanche", "mes Adidas", "Yeezy", "Veja", "Stan Smith"
  → owned_items=[{brand:"Nike", item:"baskets blanches", raw:"Nike blanche"}]
  → slot implicite = CHAUSSURES (Nike = sneakers)
  → color = Blanc cassé (couleur de l'objet, pas de la palette)
  → style implicite = Streetwear (Nike, Jordan, Yeezy, Yzy, Supreme, Vans, Converse)
                      ou Décontracté (Veja, New Balance, Common Projects)
- "mes Loro Piana", "Hermès" sans précision → loafers/mocassins → CHAUSSURES + Old money
- Mention de couleur ("blanche", "noire", "bleu marine") → capture-la dans color

Triggers à détecter ABSOLUMENT comme "owned_items" :
- "avec mes X", "avec mon X", "avec ma X" ("avec mes Loro Piana")
- "j'ai un/une/des X", "je possède X", "j'ai déjà un X"
- "accorder mon/ma/mes X" ← TRÈS FRÉQUENT ("accorder mon t-shirt bleu")
- "coordonner X", "associer X", "matcher X", "combiner X"
- "quoi mettre avec mon X", "que mettre avec ma X"
- "comment porter mon/mes X"
- "tenue autour de mon X", "construire autour de X"

Quand un de ces patterns est détecté :
- Remplis owned_items avec { item: "<pièce>", "raw": "<segment complet>" }
- Si une couleur est mentionnée ("t-shirt bleu"), capture-la dans color
- Tu ne proposes JAMAIS de remplacer la pièce que l'utilisateur a déjà
- Tu CONSTRUIS AUTOUR : propose haut+bas+chaussures+accessoires AUTRES que la pièce
- styling_advice DOIT commencer par "Avec votre [item]..." pour confirmer
- Tu inférés le style implicite (Loro Piana = old money, COS = minimaliste,
  Levi's = casual, Hermès = luxe discret) et tu alignes le reste
- Si la marque/item est ambigu(e), donne 2-3 options conditionnelles
- Tu NE recommandes JAMAIS la même marque pour le reste (pas Loro Piana × 5)

Ta tâche : extraire les entités structurées d'une demande utilisateur en français.

VOCABULAIRE STRICT — utilise UNIQUEMENT ces valeurs :

occasion : Mariage, Cérémonie, Bureau, Date, Voyage, Weekend, Galerie, Dîner, \
Brunch, Café, Soirée, Plage. (Une seule.)

style : Minimaliste, Bohème, Romantique, Streetwear, Formel, Vintage, \
Luxe discret, Bourgeoisie, Avant-garde, Préppy, Vêtements de travail, \
Années 2000. (Une seule.)

season : Printemps, Été, Automne, Hiver. (Une seule, ou omis si neutre.)

culture : english, french, italian, japanese, scandinavian, moroccan, indian, \
african, mexican, american, portuguese, russian, german, dutch, austrian, \
australian, cuban, ottoman, asian, south-american, international. (Une seule.)

color : Bordeaux, Marine, Noir, Blanc, Crème, Sauge, Olive, Terracotta, \
Camel, Rose, Moutarde, Anthracite. (Une seule, la couleur DOMINANTE souhaitée.)

avoidColor : même vocabulaire que color, mais pour ce que l'utilisateur \
refuse explicitement.

emotion : upbeat, calm, moody, bold, romantic, casual.

formality : formal, business, casual-chic, street, luxury.

gender : femme, homme, unisexe.

materials : tableau optionnel de matières demandées explicitement, vocabulaire libre \
parmi : lin, soie, satin, cachemire, laine, mohair, alpaga, coton, popeline, denim, \
velours, daim, cuir, viscose, lyocell, tweed, flanelle, gabardine, jersey, polaire, duvet.

specific_items : tableau optionnel des pièces vestimentaires explicitement nommées \
dans la demande (chemise, robe, blazer, manteau, sneakers, derbies…). Si l'utilisateur \
dit "je cherche une chemise blanche", remplis ce champ avec ["chemise"].

excluded : objet optionnel avec sous-champs colors[], materials[], items[], features[]. \
À remplir quand l'utilisateur exclut explicitement (mots déclencheurs : "sans", "pas de", \
"j'évite", "jamais", "surtout pas", "rien qui"). Features = "talon", "manche longue", \
"logo apparent", "imprimé", "transparent", "moulant", "court", etc.

practical : objet optionnel avec sous-champs weather (froid|chaud|pluie|neige|vent), \
activity ("voyage avion", "vélo", "marche"…), body_focus ("atténuer le ventre", \
"valoriser les jambes", "structurer les épaules"…).

owned_items : tableau optionnel des vêtements que l'utilisateur POSSÈDE \
DÉJÀ et autour desquels il veut composer ("avec mes Loro Piana", \
"ma chemise blanche", "mon jean droit", "j'ai un manteau bordeaux"). \
Format : [{ brand?: string, item?: string, raw: string }]. \
IMPORTANT : quand owned_items est rempli, ton styling_advice doit \
CONSTRUIRE AUTOUR de ces pièces — ne propose JAMAIS de remplacer ce que \
l'utilisateur a déjà.

confidence : 0.0 à 1.0 selon la clarté de la demande.

interpretation : 1 phrase courte qui paraphrase la demande pour confirmer \
à l'utilisateur que tu as bien compris.

styling_advice : 2-3 phrases en première personne (TU/VOUS), \
ton de vrai styliste. Combine la demande + le profil (genre, style, \
morphologie, budget) pour donner un conseil concret. Exemples : \
"Pour ce dîner d'automne, je vous suggère une palette terreuse en sablier — \
votre silhouette mettra en valeur une robe portefeuille couleur brique \
avec une ceinture fine. Budget moyen → COS ou Massimo Dutti seraient \
parfaits." OU pour homme : "Avec votre morpho athlétique et style \
Old money, une chemise oxford crème avec un chino camel fonctionnerait \
mieux qu'un blazer structuré. Dans votre budget, regardez Officine \
Générale ou COS pour le bon tomber."

RÉPONDS UNIQUEMENT EN JSON VALIDE, sans texte autour, sans markdown. \
Omets les champs que tu ne peux pas déduire avec confiance.

EXEMPLES :

Demande : "j'ai un resto ce soir, je veux des tons sombres"
{"occasion":"Dîner","color":"Noir","emotion":"moody","formality":"casual-chic","confidence":0.9,"interpretation":"Dîner du soir en tons sombres et discrets."}

Demande : "mariage italien en juin, pas trop chic"
{"occasion":"Mariage","culture":"italian","season":"Été","style":"Bohème","formality":"casual-chic","confidence":0.85,"interpretation":"Mariage italien d'été, registre bohème plus que formel."}

Demande : "vacances à Tokyo, palette monochrome"
{"occasion":"Voyage","culture":"japanese","color":"Noir","style":"Minimaliste","confidence":0.9,"interpretation":"Voyage à Tokyo, palette monochrome minimaliste."}

Demande : "je cherche une chemise blanche en lin pour homme, sans logo, pour un mariage en plein air l'été"
{"occasion":"Mariage","season":"Été","gender":"homme","color":"Blanc","specific_items":["chemise"],"materials":["lin"],"excluded":{"features":["logo"]},"practical":{"weather":"chaud"},"style":"Bohème","formality":"casual-chic","confidence":0.95,"interpretation":"Chemise blanche en lin homme, mariage estival en extérieur, sans logo apparent.","styling_advice":"Pour ce mariage en plein air, je vous suggère une chemise lin blanc cassé col cubain — légère, élégante, qui respire à la chaleur. Évitez le coton popeline trop strict. Une paire d'espadrilles tan en accent et un chino crème termineront le look. Regardez Officine Générale ou COS pour la coupe."}

Demande : "j'ai froid, je veux quelque chose qui m'aille bien à mon ventre"
{"practical":{"weather":"froid","body_focus":"atténuer le ventre"},"style":"Décontracté","formality":"casual-chic","confidence":0.85,"interpretation":"Tenue hivernale confortable, ligne flatteuse pour le ventre.","styling_advice":"Une grosse maille en V profond va structurer le buste et étirer la silhouette. Combinez avec un pantalon droit taille mi-haute (jamais taille basse) — il marque la taille sans serrer le ventre. Manteau long ouvert pour allonger. COS ou Massimo Dutti pour les bons tombants."}

Demande : "sortie running avec des amis, je veux pas avoir l'air en sport"
{"practical":{"activity":"running"},"style":"Sport-chic","formality":"casual-chic","confidence":0.85,"interpretation":"Activité running mais l'utilisateur veut un rendu non-sportif.","styling_advice":"Misez sur le sportswear élégant : sneakers blanches premium (Veja, Common Projects), un jogging en jersey épais (pas de polyester brillant) et un sweat coupe carrée. Évitez les logos voyants. Adidas Spezial ou Lacoste fonctionnent."}

Demande : "je veux une tenue avec mes Loro Piana"
{"owned_items":[{"brand":"Loro Piana","raw":"Loro Piana"}],"style":"Old money","formality":"casual-chic","confidence":0.9,"interpretation":"Tenue à composer autour des Loro Piana de l'utilisateur.","styling_advice":"Vos Loro Piana sont la signature — on construit autour, on ne les remplace pas. Si ce sont les mocassins Summer Charms : pantalon en laine fraîche couleur taupe ou camel, polo en piqué de coton blanc cassé, ceinture en cuir cognac fin. Si c'est le cardigan cachemire : chemise oxford blanche, chino caramel, derbies marron. Évitez le streetwear ou les matières synthétiques — ça casserait la cohérence luxe discret."}

Demande : "j'ai un jean droit Levis, qu'est-ce que je mets avec pour aller au boulot"
{"owned_items":[{"brand":"Levi's","item":"jean","raw":"jean droit Levis"}],"occasion":"Bureau","style":"Classique","formality":"casual-chic","confidence":0.92,"interpretation":"Composer une tenue bureau autour d'un jean droit Levi's.","styling_advice":"Le jean droit pour le bureau, c'est friday-mood ou ambiance créative. Posez dessus une chemise oxford blanche ou crème (Officine Générale, COS), un blazer décontracté en lin ou flanelle non doublé, et des mocassins en cuir tan. Évitez les sneakers — ça basculerait trop casual."}

Demande : "ma chemise blanche oxford, comment l'associer pour un dîner"
{"occasion":"Dîner","owned_items":[{"item":"chemise","raw":"chemise blanche oxford"}],"color":"Blanc","style":"Classique","formality":"casual-chic","confidence":0.93,"interpretation":"Tenue dîner autour d'une chemise oxford blanche existante.","styling_advice":"La chemise oxford blanche est une base parfaite. Pour un dîner soigné : pantalon laine sombre (marine ou anthracite), ceinture cuir lisse, derbies ou mocassins. Sortez du col boutonné en relevant un bouton, manches retroussées une fois pour casser la rigueur. Une veste en velours côtelé bordeaux ou un blazer marine si l'ambiance est plus formelle."}

Demande : "je veux accorder mon t-shirt bleu"
{"owned_items":[{"item":"t-shirt","raw":"t-shirt bleu"}],"color":"Marine","style":"Décontracté","formality":"casual-chic","confidence":0.9,"interpretation":"Composer une tenue casual autour d'un t-shirt bleu existant.","styling_advice":"Avec votre t-shirt bleu, plusieurs directions s'ouvrent. Casual chic : pantalon chino crème ou camel + sneakers blanches type Veja, ceinture cuir cognac. Si vous voulez plus relax : jean droit brut + Stan Smith. Si le bleu est foncé/marine, tirez vers le smart casual avec un blazer non-doublé taupe et des derbies. Le t-shirt bleu marche aussi sous un cardigan beige (cachemire si possible) en automne. Évitez le blanc strict en bas — préférez les tons chauds qui adoucissent le bleu."}

Demande : "Nike blanche"
{"owned_items":[{"brand":"Nike","item":"baskets blanches","raw":"Nike blanche"}],"color":"Blanc","style":"Streetwear","formality":"street","confidence":0.9,"interpretation":"Composer une tenue casual autour de baskets Nike blanches.","styling_advice":"Avec vos Nike blanches, on reste dans le registre casual/streetwear. Un hoodie oversized en molleton (gris, écru ou olive) sur un cargo large ou un jean droit large. Bomber léger en accent pour la veste. Pas de blazer, pas de derbies — vos sneakers dictent le ton. Casquette baseball pour finir le look. Regardez COS, Carhartt WIP ou Uniqlo U pour les volumes nets."}

Demande : "mes Adidas Samba en daim noir"
{"owned_items":[{"brand":"Adidas","item":"Samba daim noir","raw":"Adidas Samba en daim noir"}],"color":"Noir","style":"Décontracté","formality":"casual-chic","confidence":0.92,"interpretation":"Composer une tenue casual autour de Samba noires en daim.","styling_advice":"Les Samba noires sont des sneakers iconiques — autour, ça veut du casual élégant. Jean droit indigo brut, t-shirt blanc cassé épais ou polo maille fine, surchemise denim ou cardigan beige selon la saison. Évitez les blazers stricts et les mocassins — vos Samba sont déjà le focal. A.P.C., COS, Officine Générale fonctionnent bien."}

Demande : "quoi mettre avec ma jupe noire crayon"
{"owned_items":[{"item":"jupe","raw":"jupe noire crayon"}],"color":"Noir","style":"Classique","formality":"business","confidence":0.92,"interpretation":"Composer une tenue autour d'une jupe crayon noire.","styling_advice":"Avec votre jupe crayon noire, classique mais pas figée. Pour le bureau : chemise oxford blanche + escarpins nude, sac structuré camel — Massimo Dutti ou Sézane fonctionnent. Pour le soir : top satin couleur ivoire ou bordeaux profond, escarpins noirs vernis. En weekend chic : maille fine col rond gris perle + ballerines plates et trench beige. Évitez le total look noir sauf si vous cassez avec un accessoire vif (sac rouge, foulard imprimé)."}`;

/**
 * Infère le slot anchor (haut/bas/veste/chaussures/accent) depuis le
 * libellé d'un owned_item.
 *
 * Bug fix 2026-05-22 (« Nike blanche → trench + mules ») :
 *   Avant, "Nike" n'était reconnu nulle part → fallback "haut" → l'assistant
 *   plaçait les Nike au slot HAUT et générait des chaussures (mules) à la
 *   place. Maintenant, toutes les marques sport sont mappées chaussures.
 *
 * Ordre des tests : chaussures (priorité — ancrage signature très fréquent),
 * puis bas, veste, accent, haut.
 */
function inferSlotFromOwnedItem(items?: Array<{ brand?: string; item?: string; raw?: string }>): Slot | null {
  if (!items || items.length === 0) return null;
  const text = items.map((i) => `${i.item || ""} ${i.brand || ""} ${i.raw || ""}`).join(" ").toLowerCase();
  // Chaussures — types génériques + marques sneakers/sport + marques loafers luxe
  const SHOE_TYPES = "mocassins?|derbies|richelieux?|chelsea|chaussures?|sneakers?|baskets?|tennis|bottes?|bottines?|escarpins?|sandales?|mules?|loafers?|ballerines?|espadrilles?";
  const SHOE_BRANDS_SPORT = "nike|adidas|veja|new balance|asics|puma|converse|vans|reebok|salomon|hoka|on running|on cloud|saucony|mizuno";
  const SHOE_MODELS = "stan smith|samba|gazelle|air max|air force|jordan|yeezy|dunk|chuck taylor|sk8|old skool|spezial|cortez|blazer (?:mid|low)";
  const SHOE_BRANDS_LUX = "loro piana|hermes|hermès|jm weston|j\\.m\\. weston|tod's|tods|church|crockett|berluti|common projects";
  const shoeRe = new RegExp(`\\b(?:${SHOE_TYPES}|${SHOE_BRANDS_SPORT}|${SHOE_MODELS}|${SHOE_BRANDS_LUX})\\b`, "i");
  if (shoeRe.test(text)) {
    return "chaussures";
  }
  // Bas
  if (/\b(jean|jeans|pantalon|chino|short|jupe|legging|jogging|cargo|bermuda)\b/.test(text)) {
    return "bas";
  }
  // Veste / outerwear
  if (/\b(veste|blazer|manteau|trench|doudoune|bomber|parka|cardigan|gilet|kimono|coupe-vent)\b/.test(text)) {
    return "veste";
  }
  // Accent
  if (/\b(sac|pochette|cabas|sacoche|ceinture|foulard|écharpe|chapeau|casquette|bonnet|lunettes?|montre|bijou)\b/.test(text)) {
    return "accent";
  }
  // Haut
  if (/\b(pull|chemise|t-shirt|tee|polo|top|blouse|sweat|hoodie|maille|cachemire)\b/.test(text)) {
    return "haut";
  }
  return null;
}

/* ──────────────────────────────────────────────────────────────────────
   BRAND → REGISTRE — bug fix 2026-05-22
   ──────────────────────────────────────────────────────────────────────
   Quand l'utilisateur dit "Nike blanche", on lit la marque comme un
   signal de REGISTRE (Nike = streetwear/casual). Cela évite que la tenue
   sorte un trench + mules cuir camel — incohérent avec des sneakers.

   Mapping (large coalition) :
   - Streetwear : Nike, Adidas, Jordan, Yeezy, Vans, Converse, Carhartt,
                  Supreme, Off-White, Y-3
   - Décontracté/Sport-chic : Veja, New Balance, Common Projects, Stan Smith
   - Old money : Loro Piana, Hermès, Loewe, Bottega, Brunello
   - Classique : Officine Générale, Sézane, A.P.C., COS
   - Minimal : Jil Sander, Lemaire, The Row, Toteme, Auralee
*/
function inferRegistreFromOwnedItem(
  items?: Array<{ brand?: string; item?: string; raw?: string }>
): string | null {
  if (!items || items.length === 0) return null;
  const text = items.map((i) => `${i.item || ""} ${i.brand || ""} ${i.raw || ""}`).join(" ").toLowerCase();

  if (/\b(nike|jordan|yeezy|supreme|off-white|y-3|carhartt|stussy|palace|vans|converse|adidas (?:originals|yeezy))\b/.test(text)) {
    return "Streetwear";
  }
  if (/\b(veja|new balance|common projects|stan smith|axel arigato|spring court|adidas)\b/.test(text)) {
    return "Décontracté";
  }
  if (/\b(loro piana|hermes|hermès|loewe|bottega|brunello|cucinelli|berluti|tod's|tods|cifonelli)\b/.test(text)) {
    return "Old money";
  }
  if (/\b(officine générale|officine generale|sézane|sezane|a\.p\.c|apc|cos|arket|sandro|maje)\b/.test(text)) {
    return "Classique";
  }
  if (/\b(jil sander|lemaire|the row|toteme|auralee|margiela|yohji|issey miyake)\b/.test(text)) {
    return "Minimal";
  }
  return null;
}

/* ──────────────────────────────────────────────────────────────────────
   EXTRACTION COULEUR — depuis un texte d'owned_item
   ──────────────────────────────────────────────────────────────────────
   "Nike blanche" → { hex: "#F5F2EC", name: "Blanc cassé" }
   "T-shirt bleu marine" → { hex: "#1F3A5F", name: "Marine" }

   On reste sobre : palette neutre éditoriale. Si rien ne matche, renvoie
   null et le composer utilisera la couleur dominante de la palette Wada
   matchée (comportement legacy). */
const COLOR_HINTS: Array<{ re: RegExp; hex: string; name: string }> = [
  { re: /\bblanc(?:he)?(?:s)?\b|\bblancs?\b/i,       hex: "#F5F2EC", name: "Blanc cassé" },
  { re: /\bcr[èe]me\b|\b[ée]cru\b|\bivoire\b/i,        hex: "#EFE7D6", name: "Crème" },
  { re: /\bnoir(?:es?|s?)\b/i,                        hex: "#1E1E1E", name: "Noir" },
  { re: /\banthracite\b|\bgris\s+fonc[ée]\b/i,        hex: "#2E2E30", name: "Anthracite" },
  { re: /\bgris(?:es?|s?)\b/i,                        hex: "#9B9B96", name: "Gris" },
  { re: /\bbleu\s+marine\b|\bmarine\b/i,              hex: "#1F3A5F", name: "Marine" },
  { re: /\bindigo\b|\bden(?:im)?\b/i,                 hex: "#2F4665", name: "Indigo" },
  { re: /\bbleu(?:e|es|s)?\b/i,                       hex: "#5A7A95", name: "Bleu" },
  { re: /\bbordeaux\b|\blie\s+de\s+vin\b/i,           hex: "#6B3A32", name: "Bordeaux" },
  { re: /\brouge(?:s)?\b/i,                           hex: "#9B2D20", name: "Rouge" },
  { re: /\bsauge\b|\bvert\s+sauge\b/i,                hex: "#A8B29A", name: "Sauge" },
  { re: /\bolive\b|\bkaki\b/i,                        hex: "#7D8A4A", name: "Olive" },
  { re: /\bvert(?:e|es|s)?\b/i,                       hex: "#5A6F4A", name: "Vert" },
  { re: /\bcamel\b|\bfauve\b/i,                       hex: "#A8784A", name: "Camel" },
  { re: /\bsable\b|\bbeige\b|\btaupe\b/i,             hex: "#C9B79C", name: "Sable" },
  { re: /\bterracotta\b|\bbrique\b/i,                 hex: "#A8503A", name: "Terracotta" },
  { re: /\bocre\b|\bmoutarde\b/i,                     hex: "#C9A24A", name: "Moutarde" },
  { re: /\brose\b|\bblush\b/i,                        hex: "#D6A8A8", name: "Rose" },
];

function extractColorFromOwnedItem(
  items?: Array<{ brand?: string; item?: string; raw?: string }>
): { hex: string; name: string } | null {
  if (!items || items.length === 0) return null;
  const text = items.map((i) => `${i.item || ""} ${i.brand || ""} ${i.raw || ""}`).join(" ");
  for (const hint of COLOR_HINTS) {
    if (hint.re.test(text)) return { hex: hint.hex, name: hint.name };
  }
  return null;
}

/** Convertit un NOM de couleur (vocabulaire LLM : "Bordeaux", "Marine"…)
    ou un hex en hex exploitable par le moteur de palettes. Réutilise la
    table COLOR_HINTS. Sert à brancher la couleur demandée sur le scoring
    (amélioration styliste 2026-05-24). */
function colorNameToHex(name?: string | null): string | undefined {
  if (!name) return undefined;
  const clean = name.trim().replace(/^#/, "");
  if (/^[0-9a-f]{6}$/i.test(clean)) return `#${clean}`;
  if (/^[0-9a-f]{3}$/i.test(clean)) return `#${clean}`;
  for (const hint of COLOR_HINTS) {
    if (hint.re.test(name)) return hint.hex;
  }
  return undefined;
}

/** Mappe la formality numérique (1-5) du dictionnaire local vers le
    label texte attendu par le client (qui s'aligne sur le vocabulaire LLM). */
function formalityToLabel(n: number): string {
  if (n >= 5) return "luxury";
  if (n >= 4) return "formal";
  if (n >= 3) return "business";
  if (n >= 2) return "casual-chic";
  return "street";
}

/** Construit un bloc texte qui résume le profil utilisateur pour le LLM.
    Si aucune préférence n'est posée, retourne string vide (LLM doit deviner). */
function buildProfileBlock(p: UserPrefs): string {
  const parts: string[] = [];
  if (p.gender) {
    const label = p.gender === "femme" ? "féminin" : p.gender === "homme" ? "masculin" : "non-binaire/unisexe";
    parts.push(`Genre : ${label}`);
  }
  if (p.style) parts.push(`Style préféré : ${p.style}`);
  if (typeof p.budget === "number") {
    const labels = ["≤ 200€ (accessible)", "200-500€ (milieu de gamme)", "≥ 500€ (premium)"];
    parts.push(`Budget tenue complète : ${labels[p.budget] || "non précisé"}`);
  }
  if (p.morpho) {
    const morphoLabels: Record<string, string> = {
      droite: "silhouette droite (rectangle)",
      sablier: "silhouette sablier",
      poire: "silhouette poire",
      athletique: "silhouette athlétique (épaules larges)",
      ronde: "silhouette ronde",
    };
    parts.push(`Morphologie : ${morphoLabels[p.morpho] || p.morpho}`);
  }
  if (p.size) parts.push(`Taille : ${p.size}`);
  if (typeof p.intensity === "number") {
    const label = p.intensity >= 0.66 ? "affirmé (pièces statement)" : p.intensity <= 0.33 ? "neutre (discret)" : "équilibré";
    parts.push(`Intensité voulue : ${label}`);
  }
  if (parts.length === 0) return "";
  return `PROFIL UTILISATEUR :\n${parts.map((p) => `- ${p}`).join("\n")}`;
}

/** Convertit un résultat de l'interpreter local → format StylistEntities
    pour réponse client. Les champs LLM-only (culture, season, emotion)
    restent vides — le LLM les remplira si appelé. */
function localToEntities(local: import("@/lib/styleInterpreter").InterpretResult): StylistEntities {
  return {
    occasion: local.occasion,
    style: local.style,
    color: local.color_mood,
    formality: local.formality !== undefined ? formalityToLabel(local.formality) : undefined,
    materials: local.materials,
    specific_items: local.specific_items,
    excluded: local.excluded,
    practical: local.practical,
    owned_items: local.owned_items,
    confidence: local.matched_via === "fallback" ? 0.4 : 0.85,
    interpretation: local.explanation || undefined,
  };
}

/** Dédup d'arrays optionnels — utile pour fusionner local + LLM */
function dedupArr(a?: string[], b?: string[]): string[] | undefined {
  const all = [...(a || []), ...(b || [])];
  if (!all.length) return undefined;
  return Array.from(new Set(all));
}

/** Merge deux objets `excluded` en faisant l'union des sous-arrays */
function mergeExcluded(
  a?: { colors?: string[]; materials?: string[]; items?: string[]; features?: string[] },
  b?: { colors?: string[]; materials?: string[]; items?: string[]; features?: string[] }
) {
  if (!a && !b) return undefined;
  const merged = {
    colors: dedupArr(a?.colors, b?.colors),
    materials: dedupArr(a?.materials, b?.materials),
    items: dedupArr(a?.items, b?.items),
    features: dedupArr(a?.features, b?.features),
  };
  // Si tout est vide, on retourne undefined
  if (!merged.colors && !merged.materials && !merged.items && !merged.features) return undefined;
  return merged;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query: string = body.query;
    const userPrefs: UserPrefs = body.userPrefs || {};
    // Brief conversationnel 2026-05-23 : le client peut envoyer l'état de
    // collecte accumulé (piece/couleur/style/occasion) pour que le LLM
    // sache ce qui a déjà été demandé et ne repose pas la question.
    const collecte: { piece?: string|null; couleur?: string|null; style?: string|null; occasion?: string|null } = body.collecte || {};

    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Query trop courte" } satisfies { error: string },
        { status: 400 }
      );
    }

    // ─── COUCHE LOCALE (gratuite, ~0ms) ────────────────────────────
    // On essaie d'abord le dictionnaire FR statique. Le local interpreter
    // extrait : occasion, style, materials, specific_items, excluded,
    // practical. Si on a une intention exacte ou conflict rule MATCHÉE
    // ET pas de query complexe (multi-clauses), on retourne directement.
    /* Brief 2026-05-26 « l'assistant doit VRAIMENT comprendre » : on
       élargit le critère "complexe" pour FORCER le LLM dès qu'il y a
       un thème, une occasion, une demande conversationnelle, un mood
       — bref, tout sauf une extraction triviale de couleur/style. Sans
       ça, "soirée à thème pirate" (court, sans connecteur) était traité
       par le dictionnaire local qui ne comprenait rien et déclenchait
       un script "De quelle couleur ?" en frontend. */
    const local = localInterpret(query);
    const THEMATIC_PATTERN = /pirate|gatsby|western|halloween|cosplay|carnaval|soir[ée]e|mariage|bapt[êe]me|gala|enterrement|premier rendez|premi[èe]re|conseill?es?|propose?|aide|sais\s*pas|comment|que faut|que mettre|quoi mettre|demain|ce soir|cette semaine|samedi|dimanche|vendredi|f[êe]te|anniversaire|voyage|vacances|plage|montagne|campagne|brunch|d[îi]ner|cocktail|concert/i;
    const isComplexQuery =
      query.length > 60 ||
      /\set\s|\smais\s|\spour\s|\spendant\s/.test(query) ||
      THEMATIC_PATTERN.test(query) ||
      /[?]/.test(query); // toute question explicite passe au LLM
    if (
      !isComplexQuery &&
      (local.matched_via === "intention" || local.matched_via === "conflict")
    ) {
      return NextResponse.json({
        entities: localToEntities(local),
        source: "local-dict",
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Pas de clé OpenAI : on retombe sur ce que le dictionnaire local
      // a trouvé (matières, items, exclusions, pratique) — même sans LLM
      // la réponse reste riche.
      return NextResponse.json({
        entities: localToEntities(local),
        source: "local-fallback",
      });
    }

    // Compose le message utilisateur avec son profil pour personnaliser
    const profileBlock = buildProfileBlock(userPrefs);
    /* ─── Construction du message utilisateur ──────────────────────
       Inclut le profil (genre/style/budget) ET l'état de collecte
       conversationnel (ce qui a déjà été dit) pour que le LLM ne
       repose pas une question déjà répondue. */
    const collecteBlock = (collecte.piece || collecte.couleur || collecte.style || collecte.occasion)
      ? `ÉTAT DE LA CONVERSATION (déjà collecté) :\n${JSON.stringify(collecte, null, 2)}\n`
      : "";
    const fullUserMessage = [profileBlock, collecteBlock, `Demande : "${query}"`]
      .filter(Boolean).join("\n\n");

    /* ─── LLM call avec SYSTEM_PROMPT_V2 (brief 2026-05-22) ───────────
       Sortie attendue : { reponse, accord, tenue[], preciser }. On parse
       et on construit ensuite l'API legacy {entities, composed_outfit,
       recommended_palettes} côté serveur. */
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT_V2 },
          { role: "user", content: fullUserMessage },
        ],
        temperature: 0.5,
        response_format: { type: "json_object" },
        max_tokens: 700, // V2 inclut accord + tenue 5 slots → +marge
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("[/api/stylist] OpenAI error:", response.status, errorText);
      return NextResponse.json({ entities: localToEntities(local), source: "local-llm-failed" });
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ entities: localToEntities(local), source: "local-empty" });
    }

    type V2Slot = { slot: string; type: string; couleurNom: string; hex: string; ancre: boolean };
    type V2Collecte = { piece?: string|null; couleur?: string|null; style?: string|null; occasion?: string|null };
    type V2Output = {
      // mode dual brief conversationnel 2026-05-23
      mode?: "question" | "tenue";
      reponse?: string;
      // Mode question
      champ?: "piece" | "couleur" | "style" | "occasion";
      options?: string[];
      // Mode tenue
      accord?: { ref?: string; nom?: string; couleurs?: string[] };
      tenue?: V2Slot[];
      // État conversationnel propagé
      collecte?: V2Collecte;
      // Legacy (anciens prompts)
      preciser?: string;
    };

    let v2: V2Output;
    try {
      v2 = JSON.parse(content) as V2Output;
    } catch {
      return NextResponse.json({ entities: localToEntities(local), source: "local-llm-failed" });
    }

    /* ─── Mode "question" : on retourne directement la question + options
       Le frontend affichera les chips ; pas de palette/tenue calculée. */
    if (v2.mode === "question" && v2.reponse) {
      return NextResponse.json({
        mode: "question",
        reponse: v2.reponse,
        champ: v2.champ || null,
        options: v2.options || [],
        collecte: { ...collecte, ...(v2.collecte || {}) },
        // Maintien d'un payload entities minimal pour la rétro-compat UI legacy
        entities: { ...localToEntities(local), styling_advice: v2.reponse, interpretation: v2.reponse },
      });
    }

    /* ─── Dérive les entities legacy depuis la sortie V2 + local kw ──
       V2 ne renvoie pas occasion/style/season/culture — on les garde
       depuis le keyword interpreter qui les a extraites en parallèle.
       Le styling text et la pièce ancre viennent de V2. */
    const ancreSlot = v2.tenue?.find((s) => s.ancre);
    const derivedOwnedItems = ancreSlot
      ? [{ item: ancreSlot.type, raw: ancreSlot.type }]
      : undefined;

    const merged: StylistEntities = {
      ...localToEntities(local),
      // V2 réponse devient l'interprétation + le conseil de styliste
      interpretation: v2.reponse?.split(".")[0]?.trim() || local.explanation,
      styling_advice: v2.reponse,
      // Pièce ancre détectée par le LLM (« Vos Nike blanches »…)
      owned_items: derivedOwnedItems || local.owned_items,
      // Couleur dominante = première couleur tenue ou accord
      color: v2.tenue?.[0]?.couleurNom || v2.accord?.couleurs?.[0] || local.color_mood,
    };

    // ═══════════════════════════════════════════════════════════════════
    // COLOR ENGINE — score les palettes contre l'intention utilisateur
    // ═══════════════════════════════════════════════════════════════════
    const intent: UserIntent = {
      occasion: merged.occasion,
      style: merged.style || userPrefs.style,
      season: merged.season,
      culture: merged.culture,
      mood: merged.emotion ? [merged.emotion] : undefined,
      avoid_colors: merged.excluded?.colors,
      // Amélioration styliste 2026-05-24 : la couleur collectée dans la
      // conversation (ou déduite) pilote enfin le choix de l'accord Wada.
      // Avant, "je veux du bordeaux" ne filtrait pas les palettes.
      target_color_hex: colorNameToHex(collecte.couleur || merged.color),
    };
    const engineResult = findBestPalettesWithFallback(dictionary, intent, 12);

    // Convertit les top matches au format spec "AI Stylist Engine"
    const recommended_palettes = engineResult.matches.slice(0, 6).map((m) => ({
      palette_used: m.entry.name,
      number: m.entry.number,
      score: m.score,
      colorHarmony: m.outfit.colorHarmony,
      styleConsistency: m.outfit.styleConsistency,
      seasonFit: m.outfit.seasonFit,
      trendRelevance: m.outfit.trendRelevance,
      colors: m.entry.colors,
      composition: m.entry.composition,
      match_reasons: m.match_reasons,
      url: `/palette/${m.entry.number}`,
    }));

    /* ═══════════════════════════════════════════════════════════════════
       OUTFIT COMPOSER — Spec 2 brief 2026-05 « Stylist IA comme un vrai
       styliste ». Compose une tenue COMPLÈTE (4-5 slots) en plus des
       palettes recommandées, pour que le UI puisse rendre des outfit
       cards directement (anchor + suggested + accent).

       Logique d'ancrage :
         1. Si owned_items présent → ancre = ce que le client possède
            - Slot inféré depuis l'item ("jean" → bas, "chemise" → haut...)
            - Couleur = dominante de la palette top match (fallback)
         2. Sinon → ancre = couleur dominante de la palette top + slot "haut"
       ═══════════════════════════════════════════════════════════════════ */
    let composed_outfit: ComposedOutfit | null = null;

    /* ─── Refonte 2026-05-22 — priorité 1 : V2 tenue du LLM ─────────
       Si le LLM a produit une tenue structurée (5 slots avec hex+couleur+
       ancre), on l'utilise telle quelle. C'est le moyen le plus fiable
       de respecter la pièce citée + le registre + le styling text. */
    if (v2.tenue && v2.tenue.length >= 3 && v2.accord) {
      // Cherche la palette correspondant à accord.ref dans le dictionnaire
      const accordRef = (v2.accord.ref || "").replace(/^No\.\s*/i, "").padStart(3, "0");
      const matchedEntry = dictionary.find((d) => d.number === accordRef) || engineResult.matches[0]?.entry;

      if (matchedEntry) {
        const ancre = v2.tenue.find((s) => s.ancre);
        composed_outfit = {
          anchorHex: ancre?.hex || v2.tenue[0].hex,
          anchorSlot: (ancre?.slot || "haut") as Slot,
          family: "warm", // valeur indicative — l'UI ne s'en sert pas pour le rendu
          palette: {
            entry: matchedEntry,
            matchedColor: matchedEntry.colors[0] || { hex: ancre?.hex || "#1F1B16", name: ancre?.couleurNom || "Encre" },
            distance: 0,
          },
          slots: v2.tenue.map((s) => {
            /* ─── Couche achat (brief 2026-05-25) ───────────────────────
               Pour chaque slot non-ancre, le serveur attache un lien Amazon
               (avec tag wadastyle-21) + un lien Muji si la pièce est
               minimal/basique. Le LLM ne choisit pas — il fournit type +
               couleurNom + genre du profil, on calcule les URLs ici. */
            let lienAchat: string | undefined;
            let mujiLien: string | undefined;
            if (!s.ancre) {
              const m = merchantsForPiece({
                type: s.type,
                couleurNom: s.couleurNom,
                genre: (userPrefs.gender ?? null) as "homme" | "femme" | "unisexe" | null,
                slot: s.slot as "haut" | "bas" | "veste" | "chaussures" | "accent",
              });
              lienAchat = m.find((x) => /^Amazon\b/i.test(x.label))?.url;
              mujiLien = m.find((x) => /^Muji$/i.test(x.label))?.url;
            }
            return {
              slot: s.slot as Slot,
              role: s.ancre ? ("owned" as const) : s.slot === "accent" ? ("accent" as const) : ("suggested" as const),
              label: s.type,
              hex: s.hex,
              colorName: s.couleurNom,
              wadaRef: `No. ${matchedEntry.number}`,
              lienAchat,
              mujiLien,
            };
          }),
          verdict: v2.reponse || "",
        };
      }
    }

    /* ─── Fallback : si V2 n'a pas livré une tenue exploitable, on
       compose avec le moteur d'ancrage couleur legacy. Logique inchangée. */
    if (!composed_outfit && engineResult.matches.length > 0) {
      const topMatch = engineResult.matches[0];
      const anchorSlot: Slot = inferSlotFromOwnedItem(merged.owned_items) || "haut";
      const ownedColor = extractColorFromOwnedItem(merged.owned_items);
      const ownedRegistre = inferRegistreFromOwnedItem(merged.owned_items);
      const anchorHex = ownedColor?.hex || topMatch.entry.colors[0]?.hex || "#1F1B16";
      const anchorColorName = ownedColor?.name;
      const ownedRaw = merged.owned_items?.[0]?.raw || merged.owned_items?.[0]?.item;
      const ownedLabel = ownedRaw
        ? `Vos ${ownedRaw.replace(/^(les?|la|une?)\s+/i, "").trim()}`
        : undefined;
      const registre = (ownedRegistre || merged.style || userPrefs.style || null) as
        | "Streetwear" | "Décontracté" | "Old money" | "Classique" | "Minimal" | null;
      const gender: "femme" | "homme" | "unisexe" = (userPrefs.gender ?? "unisexe") || "unisexe";

      try {
        composed_outfit = composeOutfitFromColor(anchorHex, anchorSlot, gender, {
          registre,
          ownedLabel,
          anchorColorName,
        });
        /* ─── Couche achat aussi pour le fallback legacy (brief 2026-05-25)
           Chaque slot non-owned reçoit son lienAchat / mujiLien comme dans
           le chemin V2. L'UI reste cohérente quel que soit le path. */
        if (composed_outfit) {
          composed_outfit.slots = composed_outfit.slots.map((s) => {
            if (s.role === "owned") return s;
            const m = merchantsForPiece({
              type: s.label,
              couleurNom: s.colorName,
              genre: gender,
              slot: s.slot,
            });
            return {
              ...s,
              lienAchat: m.find((x) => /^Amazon\b/i.test(x.label))?.url,
              mujiLien: m.find((x) => /^Muji$/i.test(x.label))?.url,
            };
          });
        }
      } catch (err) {
        console.error("[/api/stylist] composeOutfit failed:", err);
      }
    }

    return NextResponse.json({
      // Brief conversationnel 2026-05-23 : marqueur de mode final
      mode: "tenue",
      collecte: { ...collecte, ...(v2.collecte || {}) },
      reponse: v2.reponse,
      entities: merged,
      // Brief V2 : exposer la question de précision si le LLM en a posé une
      preciser: v2.preciser || undefined,
      recommended_palettes,
      composed_outfit,
      fallback_used: engineResult.fallback_used,
      source: "llm+local+engine+composer",
    });
  } catch (err) {
    console.error("[/api/stylist] Exception:", err);
    return NextResponse.json({ fallback: true } as { fallback: boolean });
  }
}
