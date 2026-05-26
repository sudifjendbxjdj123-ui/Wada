import { activeAwinMerchants, getAwinPublisherId } from "@/lib/affiliate";
import { amazonBrandList, AMAZON_TAG } from "@/lib/amazonAffiliate";
import { isPaapiConfigured } from "@/lib/amazonPaapi";
import { shopOptions } from "@/lib/data";
import { ink, paper, subtle, seal, mojo, border, sectionLabel, textSecondary, fontHeading, fontBody, fontLabel } from "@/lib/styles";
import Link from "next/link";

export const dynamic = "force-dynamic";

/**
 * /admin/affiliations — Dashboard de statut des affiliations.
 *
 * Liste toutes les marques que WADA route dans son shopOptions et affiche
 * pour chacune :
 *   - Statut Awin (actif / inactif)
 *   - Statut Amazon (brand store actif / non)
 *   - Recommandation d'action
 *
 * Page protégée par mot de passe via env var ADMIN_PASSWORD + cookie/query.
 * Pour MVP : on utilise un query param ?key=... pour accès rapide en dev.
 */

type SearchParams = Promise<{ key?: string }>;

export default async function AdminAffiliationsPage({
  searchParams,
}: { searchParams: SearchParams }) {
  const params = await searchParams;
  const requiredPassword = process.env.ADMIN_PASSWORD || "";
  const providedKey = params.key || "";

  // Si un mot de passe est configuré, on l'exige
  if (requiredPassword && providedKey !== requiredPassword) {
    return (
      <main style={{ minHeight: "100vh", background: paper, color: ink, fontFamily: fontBody }}>
                <div style={{ maxWidth: 480, margin: "120px auto", padding: 32, textAlign: "center" }}>
          <p style={{ ...sectionLabel, color: seal, marginBottom: 14 }}>Accès restreint</p>
          <h1 style={{ fontFamily: fontHeading, fontSize: 36, margin: "0 0 18px" }}>
            Dashboard administrateur
          </h1>
          <p style={{ fontFamily: fontBody, fontSize: 14, color: subtle, fontStyle: "italic" }}>
            Ajoute <code>?key=...</code> à l'URL avec ton mot de passe ADMIN_PASSWORD pour accéder.
          </p>
          <p style={{ marginTop: 24 }}>
            <Link href="/" style={{ fontFamily: fontLabel, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: ink }}>
              ← Retour au site
            </Link>
          </p>
        </div>
              </main>
    );
  }

  // Liste de toutes les marques uniques croisées par shopOptions
  const sampleLinks = shopOptions("pull", "Top");
  const allBrands = Array.from(new Set(sampleLinks.map((l) => l.label))).sort();

  const awinPub = getAwinPublisherId();
  const awinActive = activeAwinMerchants();
  const paapiOn = isPaapiConfigured();

  type BrandStatus = {
    name: string;
    awin: "active" | "configured" | "none";
    amazon: "active" | "search-only" | "none";
    note?: string;
  };

  const statuses: BrandStatus[] = allBrands.map((name) => {
    const onAwin = awinActive.includes(name);
    const onAmazon = amazonBrandList.includes(name);
    const amazonGeneric = name.startsWith("Amazon");
    return {
      name,
      awin: onAwin ? "active" : awinPub ? "configured" : "none",
      amazon: amazonGeneric || onAmazon ? "active" : "none",
    };
  });

  const counts = {
    awinActive: statuses.filter((s) => s.awin === "active").length,
    amazonActive: statuses.filter((s) => s.amazon === "active").length,
    total: statuses.length,
  };

  return (
    <main style={{ minHeight: "100vh", background: paper, color: ink, fontFamily: fontBody }}>
      
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "64px 32px 96px" }}>
        {/* Header */}
        <header style={{ marginBottom: 48 }}>
          <p style={{ ...sectionLabel, color: seal, marginBottom: 14, fontWeight: 600 }}>
            Admin · Dashboard
          </p>
          <h1 style={{
            fontFamily: fontHeading, fontSize: 56, fontStyle: "italic", fontWeight: 500,
            margin: "0 0 18px", lineHeight: 1.1, letterSpacing: "-0.02em",
          }}>
            Statut des affiliations
          </h1>
          <p style={{ fontFamily: fontBody, fontSize: 16, color: textSecondary, lineHeight: 1.65, maxWidth: 720 }}>
            Vue d'ensemble des marques routées par WADA, avec leur statut Awin et Amazon.
            Ajoute une marque acceptée sur Awin via la variable d'environnement{" "}
            <code style={{ background: "rgba(31,27,22,0.06)", padding: "2px 8px", borderRadius: 4, fontFamily: "monospace", fontSize: 13 }}>
              AWIN_MERCHANT_IDS
            </code>.
          </p>
        </header>

        {/* KPIs */}
        <section style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16,
          marginBottom: 56,
        }}>
          <Kpi label="Publisher Awin" value={awinPub || "—"} hint={awinPub ? "Actif" : "Non configuré"} status={awinPub ? "ok" : "warn"} />
          <Kpi label="Marques Awin" value={`${counts.awinActive}`} hint={`/ ${counts.total} routées`} status={counts.awinActive > 0 ? "ok" : "warn"} />
          <Kpi label="Tag Amazon" value={AMAZON_TAG} hint={`${counts.amazonActive} marques`} status="ok" />
          <Kpi label="PA-API Amazon" value={paapiOn ? "Actif" : "—"} hint={paapiOn ? "Photos produit live" : "En attente des 3 ventes"} status={paapiOn ? "ok" : "warn"} />
        </section>

        {/* Table marques */}
        <section>
          <h2 style={{
            fontFamily: fontHeading, fontSize: 26, fontStyle: "italic", fontWeight: 500,
            margin: "0 0 16px", color: ink,
          }}>
            Toutes les marques routées
          </h2>
          <p style={{ fontSize: 13, color: subtle, marginBottom: 24, fontStyle: "italic" }}>
            Total : {counts.total} marques. Les marques "Amazon · X" sont actives via le tag {AMAZON_TAG}.
          </p>

          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: fontBody, fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${ink}` }}>
                <th style={th}>Marque</th>
                <th style={th}>Awin</th>
                <th style={th}>Amazon</th>
                <th style={th}>Recommandation</th>
              </tr>
            </thead>
            <tbody>
              {statuses.map((s) => (
                <tr key={s.name} style={{ borderBottom: `1px solid ${border}` }}>
                  <td style={td}>{s.name}</td>
                  <td style={td}>
                    {s.awin === "active" ? <Pill kind="ok">Actif</Pill> :
                     s.awin === "configured" ? <Pill kind="warn">À demander</Pill> :
                     <Pill kind="muted">—</Pill>}
                  </td>
                  <td style={td}>
                    {s.amazon === "active" ? <Pill kind="ok">Actif</Pill> :
                     <Pill kind="muted">—</Pill>}
                  </td>
                  <td style={{ ...td, color: subtle, fontStyle: "italic", fontSize: 12 }}>
                    {s.awin === "active" ? "Commission active" :
                     s.awin === "configured" && s.amazon === "active" ? "Couvert via Amazon" :
                     s.awin === "configured" ? "Demander sur Awin Marketplace" :
                     s.amazon === "active" ? "Couvert via Amazon" :
                     "Hors-affiliation"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Aide */}
        <section style={{
          marginTop: 56, padding: 28,
          background: "rgba(31,27,22,0.04)", border: `1px solid ${border}`,
          fontFamily: fontBody,
        }}>
          <p style={{ ...sectionLabel, color: ink, marginBottom: 12, fontWeight: 700 }}>
            Comment ajouter une marque Awin
          </p>
          <ol style={{ fontSize: 14, color: textSecondary, lineHeight: 1.8, paddingLeft: 18, margin: 0 }}>
            <li>Va sur <a href="https://ui.awin.com" target="_blank" rel="noopener noreferrer" style={{ color: mojo }}>ui.awin.com</a> → Annuaire des annonceurs → cherche la marque.</li>
            <li>Clique "Rejoindre le programme" et attends l'acceptation (1-7 jours).</li>
            <li>Une fois acceptée, ouvre la fiche du programme → note le <strong>Merchant ID</strong> (5-6 chiffres).</li>
            <li>Sur Vercel → Settings → Environment Variables → mets à jour <code>AWIN_MERCHANT_IDS</code> :
              <pre style={{
                background: ink, color: paper, padding: 14, marginTop: 8,
                fontSize: 12, fontFamily: "monospace", overflowX: "auto",
              }}>
                {`{"Sézane":"12345","Net-a-Porter":"67890","La Redoute":"34567"}`}
              </pre>
            </li>
            <li>Redéploie : <code>vercel --prod</code>. La marque devient active sans changement de code.</li>
          </ol>
        </section>
      </div>
          </main>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Sous-composants
   ────────────────────────────────────────────────────────────────────── */

const th: React.CSSProperties = {
  textAlign: "left",
  fontFamily: "'Inter', sans-serif",
  fontSize: 10, fontWeight: 700,
  letterSpacing: "0.25em", textTransform: "uppercase",
  color: "#1F1B16",
  padding: "12px 8px",
};

const td: React.CSSProperties = {
  padding: "12px 8px",
  verticalAlign: "middle",
};

function Kpi({ label, value, hint, status }: { label: string; value: string; hint: string; status: "ok" | "warn" }) {
  return (
    <div style={{
      background: paper, border: `1px solid ${border}`,
      padding: "18px 20px",
    }}>
      <p style={{ ...sectionLabel, fontSize: 9, color: subtle, fontWeight: 600, marginBottom: 8 }}>{label}</p>
      <p style={{
        fontFamily: fontHeading, fontSize: 28, fontStyle: "italic", fontWeight: 500,
        margin: "0 0 4px", color: ink, lineHeight: 1, letterSpacing: "-0.01em",
      }}>
        {value}
      </p>
      <p style={{
        fontSize: 11, color: status === "ok" ? "#3B8756" : subtle,
        margin: 0, fontFamily: fontBody, fontStyle: "italic",
      }}>
        {hint}
      </p>
    </div>
  );
}

function Pill({ kind, children }: { kind: "ok" | "warn" | "muted"; children: React.ReactNode }) {
  const colors = {
    ok:    { bg: "rgba(74, 169, 108, 0.15)",   fg: "#3B8756" },
    warn:  { bg: "rgba(196, 78, 58, 0.15)",    fg: "#9C3E2E" },
    muted: { bg: "rgba(31, 27, 22, 0.06)",     fg: "#A89A85" },
  }[kind];
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 10px",
      background: colors.bg, color: colors.fg,
      fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 700,
      letterSpacing: "0.18em", textTransform: "uppercase",
      borderRadius: 3,
    }}>
      {children}
    </span>
  );
}
