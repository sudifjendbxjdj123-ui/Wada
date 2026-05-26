/**
 * newsletterStore — abonnés à « La lettre du dimanche ».
 *
 * Stocke chaque abonné dans Upstash KV sous la clé `wada:newsletter:<email>`
 * (key = email lowercased + URL-encoded). Pas de chunking nécessaire : un
 * abonné ≈ 200 octets, l'opération est par-clé, pas par-liste, donc on n'est
 * jamais limité par la 1MB Upstash.
 *
 * Schéma :
 *   {
 *     email: string,                // lowercased
 *     token: string,                // random 32 hex, sert au confirm + unsubscribe
 *     status: "pending" | "confirmed" | "unsubscribed",
 *     createdAt: string (ISO),
 *     confirmedAt?: string,
 *     source?: string,              // « footer », « tarifs », « inscription-page »…
 *   }
 *
 * Index séparé `wada:newsletter:token:<token>` → `email` pour résoudre vite
 * un lien de confirmation/désinscription sans avoir à scanner toute la liste.
 *
 * Brief P2 newsletter (24/05) : graceful degradation. Si KV n'est pas
 * configuré, les opérations renvoient un succès logique mais loggent en
 * console pour que le dev puisse poser les vars d'env plus tard. Le client
 * voit toujours « Presque fini ! ».
 */

interface KvCreds {
  url: string;
  token: string;
}

function getCreds(): KvCreds | null {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

export type SubscriberStatus = "pending" | "confirmed" | "unsubscribed";

export interface Subscriber {
  email: string;
  token: string;
  status: SubscriberStatus;
  createdAt: string;
  confirmedAt?: string;
  source?: string;
}

const KEY_PREFIX = "wada:newsletter:";
const TOKEN_PREFIX = "wada:newsletter:token:";

function keyForEmail(email: string): string {
  return `${KEY_PREFIX}${encodeURIComponent(email.toLowerCase().trim())}`;
}

function keyForToken(token: string): string {
  return `${TOKEN_PREFIX}${token}`;
}

/** Génère un token cryptographique 32 hex. Pas besoin d'unicité globale —
 *  la collision est ~ 2^-128. */
export function generateToken(): string {
  const arr = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < 16; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* ──────────────────────────────────────────────────────────────────────
   KV helpers — minimal, alignés sur productStore.ts
   ────────────────────────────────────────────────────────────────────── */

async function kvGetJson<T>(creds: KvCreds, key: string): Promise<T | null> {
  try {
    const r = await fetch(`${creds.url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${creds.token}` },
      cache: "no-store",
    });
    if (!r.ok) return null;
    const data = await r.json();
    const result = data?.result;
    if (typeof result === "string") {
      try { return JSON.parse(result) as T; } catch { return null; }
    }
    return result as T | null;
  } catch {
    return null;
  }
}

async function kvSetJson(creds: KvCreds, key: string, value: unknown): Promise<boolean> {
  try {
    const r = await fetch(`${creds.url}/set/${encodeURIComponent(key)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(value),
    });
    return r.ok;
  } catch {
    return false;
  }
}

async function kvDel(creds: KvCreds, key: string): Promise<boolean> {
  try {
    const r = await fetch(`${creds.url}/del/${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${creds.token}` },
    });
    return r.ok;
  } catch {
    return false;
  }
}

/* ──────────────────────────────────────────────────────────────────────
   API publique
   ────────────────────────────────────────────────────────────────────── */

/** Récupère un abonné par email. */
export async function getByEmail(email: string): Promise<Subscriber | null> {
  const creds = getCreds();
  if (!creds) return null;
  return await kvGetJson<Subscriber>(creds, keyForEmail(email));
}

/** Récupère un abonné par token (lien magique). */
export async function getByToken(token: string): Promise<Subscriber | null> {
  const creds = getCreds();
  if (!creds) return null;
  const email = await kvGetJson<string>(creds, keyForToken(token));
  if (!email) return null;
  return await getByEmail(email);
}

/**
 * Crée ou met à jour un abonné en statut `pending`.
 * Renvoie l'objet (avec le token à utiliser dans le lien de confirmation),
 * ou null si KV indisponible (l'appelant doit alors logger + dégrader).
 */
export async function upsertPending(
  email: string,
  source?: string,
): Promise<Subscriber | null> {
  const creds = getCreds();
  if (!creds) {
    console.log("[newsletter] KV not configured — pending subscription dropped:", email);
    return null;
  }
  const existing = await getByEmail(email);
  // Si déjà confirmé, on ne re-déclenche pas le double opt-in.
  if (existing?.status === "confirmed") {
    return existing;
  }
  // Re-génère un token (si pending récent, l'ancien lien expire de facto).
  const sub: Subscriber = {
    email: email.toLowerCase().trim(),
    token: generateToken(),
    status: "pending",
    createdAt: new Date().toISOString(),
    source,
  };
  const okEmail = await kvSetJson(creds, keyForEmail(sub.email), sub);
  const okToken = await kvSetJson(creds, keyForToken(sub.token), sub.email);
  if (!okEmail || !okToken) {
    console.log("[newsletter] KV write failed for", email);
    return null;
  }
  return sub;
}

/** Marque un abonné comme confirmé (clic sur le lien de confirmation). */
export async function confirmByToken(token: string): Promise<Subscriber | null> {
  const creds = getCreds();
  if (!creds) return null;
  const sub = await getByToken(token);
  if (!sub) return null;
  if (sub.status === "confirmed") return sub;
  const updated: Subscriber = {
    ...sub,
    status: "confirmed",
    confirmedAt: new Date().toISOString(),
  };
  await kvSetJson(creds, keyForEmail(sub.email), updated);
  return updated;
}

/** Désinscrit un abonné (clic sur lien d'unsubscribe). */
export async function unsubscribeByToken(token: string): Promise<boolean> {
  const creds = getCreds();
  if (!creds) return false;
  const sub = await getByToken(token);
  if (!sub) return false;
  // On ne supprime pas la clé email pour garder une trace (RGPD : preuve
  // de désinscription). On marque "unsubscribed".
  const updated: Subscriber = { ...sub, status: "unsubscribed" };
  await kvSetJson(creds, keyForEmail(sub.email), updated);
  // Le token n'a plus à être utilisable.
  await kvDel(creds, keyForToken(token));
  return true;
}
