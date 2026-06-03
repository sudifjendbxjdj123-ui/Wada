/**
 * scripts/upload-suitable-to-kv.mjs
 *
 * Upload direct du flux Suitable FR dans Vercel KV, sans passer par l'API
 * ni avoir besoin du CRON_SECRET.
 *
 * Usage :
 *   node scripts/upload-suitable-to-kv.mjs
 */

import { gunzipSync } from "node:zlib";
import { readFileSync, createReadStream } from "node:fs";
import { createInterface } from "node:readline";

// Passe SLUG et CSV_PATH en argument : node script.mjs muji | node script.mjs suitable
const WHICH = process.argv[2] || "suitable";
const CSV_PATH = WHICH === "muji"
  ? "C:/Users/neman/Downloads/muji-feed.csv.gz"
  : "C:/Users/neman/Downloads/34175-78127-fr_FR-Suitable_Menswear_-_Webshop_FR.csv.gz";
const KV_URL   = "https://fit-insect-135036.upstash.io";
const KV_TOKEN = "gQAAAAAAAg98AAIgcDI0YmViZjExZDJkNGM0NmVjOTM0ODkwZWRkODFmYzU3Mw";
const SLUG     = WHICH === "muji" ? "muji-france" : "suitable-fr";

// ── Helpers KV (même logique que lib/productStore.ts) ──
const CHUNK_SIZE = 900_000; // 900KB par chunk (limite Upstash 1MB)
const KEY_INDEX  = "wada:products:index";
const KEY_CHUNK  = (n) => `wada:products:chunk:${n}`;

async function kvGet(key) {
  const res = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  const json = await res.json();
  return json.result ? JSON.parse(json.result) : null;
}

async function kvSet(key, value) {
  const serialized = JSON.stringify(value);
  // Upstash REST API simple SET
  const res = await fetch(`${KV_URL}/set/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      "Content-Type": "text/plain",
    },
    body: serialized,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`KV SET failed: ${res.status} — ${txt.slice(0,200)}`);
  }
}

async function readAllFromKV() {
  const index = await kvGet(KEY_INDEX);
  if (!index) return [];
  const chunks = await Promise.all(
    Array.from({ length: index.chunks }, (_, i) => kvGet(KEY_CHUNK(i)))
  );
  return chunks.flat().filter(Boolean);
}

async function writeAllToKV(products) {
  const chunks = [];
  let current = [];
  let currentSize = 0;
  for (const p of products) {
    const s = JSON.stringify(p).length + 1;
    if (currentSize + s > CHUNK_SIZE && current.length > 0) {
      chunks.push(current);
      current = [];
      currentSize = 0;
    }
    current.push(p);
    currentSize += s;
  }
  if (current.length > 0) chunks.push(current);

  console.log(`  Writing ${chunks.length} chunks (${products.length} products total)...`);
  for (let i = 0; i < chunks.length; i++) {
    await kvSet(KEY_CHUNK(i), chunks[i]);
    process.stdout.write(`\r  Chunk ${i + 1}/${chunks.length} written`);
  }
  console.log();
  await kvSet(KEY_INDEX, { chunks: chunks.length, total: products.length, updated: new Date().toISOString() });
}

// ── CSV Parser (minimal, copié de lib/awinFeed.ts) ──
function parseCsvLine(line) {
  const cells = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i+1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (c === ',' && !inQ) { cells.push(cur); cur = ''; }
    else cur += c;
  }
  cells.push(cur);
  return cells;
}

function hexToLab(hex) {
  let r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255;
  r = r > 0.04045 ? ((r+0.055)/1.055)**2.4 : r/12.92;
  g = g > 0.04045 ? ((g+0.055)/1.055)**2.4 : g/12.92;
  b = b > 0.04045 ? ((b+0.055)/1.055)**2.4 : b/12.92;
  let x = (r*0.4124+g*0.3576+b*0.1805)/0.95047;
  let y = (r*0.2126+g*0.7152+b*0.0722)/1.00000;
  let z = (r*0.0193+g*0.1192+b*0.9505)/1.08883;
  x = x > 0.008856 ? x**(1/3) : 7.787*x+16/116;
  y = y > 0.008856 ? y**(1/3) : 7.787*y+16/116;
  z = z > 0.008856 ? z**(1/3) : 7.787*z+16/116;
  return [116*y-16, 500*(x-y), 200*(y-z)];
}

const COLOR_MAP = {
  "bleu": "#5A7A95","bleu clair": "#7BACC4","bleu foncé": "#1F3A5F",
  "beige": "#C9B79C","blanc": "#F5F2EC","blanc cassé": "#EFE7D6",
  "noir": "#1E1E1E","gris": "#9B9B96","anthracite": "#2E2E30",
  "marron": "#6B4A33","kaki": "#7D8A4A","vert": "#5A6F4A",
  "vert foncé": "#3A5A30","rose": "#D6A8A8","rouge": "#9B2D20",
  "bordeaux": "#6B3A32","orange": "#C97A3A","jaune": "#D6BE6B",
  "violet": "#6B4A8A","multicoloré": "#9B9B96","cognac": "#8A5A33",
  "taupe": "#C9B79C",
};

function colorToHex(nom) {
  if (!nom) return "#9B9B96";
  const k = nom.toLowerCase().trim();
  if (COLOR_MAP[k]) return COLOR_MAP[k];
  for (const [key, hex] of Object.entries(COLOR_MAP)) {
    if (k.includes(key) || key.includes(k)) return hex;
  }
  return "#9B9B96";
}

const MERCHANT_CATEGORY_MAP = {
  "chemises": "haut","polos": "haut","t-shirts": "haut","pulls et sweats": "haut",
  "pantalons": "bas","shorts": "bas","vestes": "veste","vestes & blazers": "veste",
  "gilets": "veste","costumes": "veste","smoking": "veste","chaussures": "chaussures",
  "ceintures": "accent","cravates": "accent","casquettes et chapeaux": "accent",
  "écharpes": "accent","echarpes": "accent","gants": "accent","sacs": "accent",
  "noeuds papillon & ceintures de smoking": "accent","bretelles": "accent",
  "boutons de manchette": "accent","pochettes de costume": "accent","bonnets": "accent",
};

const EXCLUDED = new Set(["boxers","shorts de bain","peignoirs de bain","chaussettes"]);

// Marques → registre (simplifié)
const BRAND_REG = {
  "suitable":"classique","olymp":"classique","profuomo":"classique","meyer":"classique",
  "desoto":"classique","casamoda":"classique","boss":"classique","pierre cardin":"classique",
  "gant":"classique","slater":"classique","pme legend":"decontracte","vanguard":"decontracte",
  "state of art":"decontracte","steppin' out":"decontracte","no excess":"decontracte",
  "tommy hilfiger":"decontracte","mac":"decontracte","cast iron":"decontracte",
  "sun68":"decontracte","bjorn borg":"decontracte","lyle and scott":"decontracte",
  "scotch and soda":"decontracte","king essentials":"decontracte","alan red":"decontracte",
  "marc o'polo":"decontracte","new zealand auckland":"decontracte","superdry":"decontracte",
  "fred perry":"decontracte","lacoste":"decontracte","alberto":"classique","gardeur":"classique",
  "r2 amsterdam":"classique","pure":"classique","blue industry":"classique","giorgio":"classique",
  "knowledgecotton apparel":"decontracte","petrol":"decontracte","hoff":"decontracte",
  "save the duck":"outdoor","tenson":"outdoor","didriksons":"outdoor",
  "sir redman":"classique","cavallaro napoli":"classique","sebago":"classique","new era":"streetwear",
  "mcgregor":"classique","william lockie":"classique","steppin out":"decontracte",
  "mey":"decontracte","supply & co":"decontracte","shiwi":"decontracte",
};

function getRegistre(brand) {
  return BRAND_REG[brand?.toLowerCase()?.trim()] || null;
}

function normalize(raw, hdr) {
  const get = (col) => (raw[hdr.indexOf(col)] || "").trim();
  const id = get("aw_product_id");
  const nom = get("product_name");
  const url = get("aw_deep_link");
  if (!id || !nom || !url) return null;

  const merchantCat = get("merchant_category").toLowerCase();
  if (EXCLUDED.has(merchantCat)) return null;

  const categorie = MERCHANT_CATEGORY_MAP[merchantCat] || null;
  if (!categorie) return null;

  const couleurNom = get("colour") || "Beige";
  const hex = colorToHex(couleurNom);
  const prix = parseFloat(get("search_price") || get("store_price") || "0");
  if (!prix) return null;

  const brand = (get("brand_name") || "Suitable").replace(/\s+(France|Europe|UK)$/i,"");
  const marchand = get("merchant_name") || "Suitable FR";
  const image = get("merchant_image_url") || get("aw_image_url") || "";

  return {
    id: `suitable-fr:${id}`,
    marchand, marchandSlug: "suitable-fr", awinMid: "34175",
    marque: brand,
    nom: nom.slice(0, 200),
    description: (get("description") || "").slice(0, 140),
    categorie, genre: "homme",
    couleurNom, hex, prix, devise: "EUR",
    tailles: undefined, enStock: true,
    image, thumb: undefined, largeImage: image,
    urlProduit: url,
    paletteRef: undefined, paletteDistance: undefined,
    brandRegistre: getRegistre(brand) || "classique",
  };
}

// ── MAIN ──
async function main() {
  console.log("1. Reading CSV.gz...");
  const buf = gunzipSync(readFileSync(CSV_PATH));
  const csv = buf.toString("utf-8");
  const lines = csv.split("\n").filter(l => l.trim());
  console.log(`   ${lines.length} lines`);

  const hdr = parseCsvLine(lines[0]);
  console.log(`   ${hdr.length} columns`);

  const newProducts = [];
  let dropped = 0;
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const p = normalize(cells, hdr);
    if (p) newProducts.push(p); else dropped++;
  }
  console.log(`   Parsed: ${newProducts.length} kept, ${dropped} dropped`);

  console.log("2. Reading existing KV products...");
  const existing = await readAllFromKV();
  console.log(`   ${existing.length} products currently in KV`);

  const retained = existing.filter(p => p.marchandSlug !== SLUG);
  console.log(`   Keeping ${retained.length} non-Suitable products`);

  const merged = [...retained, ...newProducts];
  console.log(`   Total after merge: ${merged.length}`);

  console.log("3. Writing to KV...");
  await writeAllToKV(merged);

  console.log(`\n✅ Done! ${newProducts.length} Suitable FR products ingested.`);
  console.log(`   Total KV: ${merged.length} products`);
  console.log(`   Distribution: MUJI+TBF=${retained.length}, Suitable=${newProducts.length}`);
}

main().catch(e => { console.error("❌", e); process.exit(1); });
