"use client";
import { useEffect, useState } from "react";
import { ink, paper, subtle, mojo, border, fontHeading, fontBody, fontLabel } from "@/lib/styles";

/**
 * Évènement beforeinstallprompt — typage manuel (pas dans lib.dom.d.ts).
 */
interface BIPEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

/**
 * InstallPrompt — bouton flottant qui propose d'installer WADA comme app.
 *
 * Sur Chrome/Edge/Android : écoute beforeinstallprompt → bouton "Installer"
 *   → appelle prompt() natif → suit le userChoice
 * Sur iOS Safari : pas d'API → affiche un guide "Partager → Sur l'écran d'accueil"
 *
 * Apparaît après 30s de navigation et seulement si :
 *   - l'app n'est pas déjà installée (standalone mode)
 *   - l'utilisateur n'a pas dismissé dans les 7 derniers jours
 *
 * Caché en mode standalone (déjà installée) ou si refusé récemment.
 */
export default function InstallPrompt() {
  const [bipEvent, setBipEvent] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Déjà en standalone (installé) → ne rien afficher
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;

    // Dismiss récent (7 jours) → ne pas réafficher
    try {
      const lastDismiss = localStorage.getItem("wada-install-dismissed");
      if (lastDismiss) {
        const elapsed = Date.now() - parseInt(lastDismiss, 10);
        if (elapsed < 7 * 24 * 60 * 60 * 1000) return;
      }
    } catch {}

    // Détection iOS Safari (pas de beforeinstallprompt sur iOS)
    const ua = window.navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream;
    setIsIOS(ios);

    const timers: NodeJS.Timeout[] = [];

    // Listener pour Chrome/Edge/Android
    const onBIP = (e: Event) => {
      e.preventDefault();
      setBipEvent(e as BIPEvent);
      // Attendre 30s avant d'afficher pour ne pas être intrusif
      timers.push(setTimeout(() => setVisible(true), 30_000));
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    // iOS : afficher après 30s même sans BIP
    if (ios) {
      timers.push(setTimeout(() => setVisible(true), 30_000));
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      timers.forEach(t => clearTimeout(t));
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (!bipEvent) return;
    await bipEvent.prompt();
    const { outcome } = await bipEvent.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    } else {
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem("wada-install-dismissed", String(Date.now()));
    } catch {}
  };

  if (!visible) return null;

  return (
    <>
      <aside
        role="dialog"
        aria-label="Installer WADA"
        className="wada-install-prompt"
        style={{
          position: "fixed",
          // Brief audit mobile §5 : bottom = max(20px, safe-area) pour
          // ne pas chevaucher la barre gestuelle iPhone.
          // Sur ≤880px (mobile), une règle CSS .wada-install-prompt
          // pousse à 76px pour passer au-dessus de MobileTabBar.
          bottom: "max(20px, env(safe-area-inset-bottom))",
          right: 20,
          maxWidth: 340,
          background: paper,
          border: `1px solid ${ink}`,
          padding: 18,
          boxShadow: "0 12px 32px rgba(31, 27, 22, 0.18)",
          zIndex: 1000,
          fontFamily: fontBody,
        }}
      >
        <button
          onClick={handleDismiss}
          aria-label="Fermer"
          style={{
            position: "absolute",
            // Brief audit mobile §4 : 44×44 minimum tactile (WCAG 2.5.5
            // + Apple HIG). Offset top/right négatif pour que le ✕ reste
            // visuellement collé au coin malgré la zone étendue.
            top: -4, right: -4,
            minWidth: 44, minHeight: 44,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "transparent", border: "none",
            cursor: "pointer", color: subtle, fontSize: 22, lineHeight: 1,
          }}
        >
          ✕
        </button>

        <p style={{
          fontFamily: fontLabel,
          fontSize: 9, letterSpacing: "0.35em", textTransform: "uppercase",
          color: mojo, fontWeight: 700, margin: "0 0 8px",
        }}>
          Installer WADA
        </p>
        <h3 style={{
          fontFamily: fontHeading, fontSize: 20, fontStyle: "italic", fontWeight: 500,
          margin: "0 0 10px", color: ink, lineHeight: 1.2,
        }}>
          Le dictionnaire, sur votre écran d'accueil.
        </h3>
        {/* Brief audit 2026-05-28 M7 — message ajusté : l'app wrap le site
            distant, pas un vrai mode hors-ligne. On promet juste démarrage
            rapide + scanner natif (caméra), claims qu'on tient vraiment. */}
        <p style={{
          fontSize: 13, color: ink, margin: "0 0 14px",
          lineHeight: 1.55,
        }}>
          Le scanner couleur natif, démarrage rapide, ergonomie pleine page.
        </p>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleInstall}
            style={{
              background: ink, color: paper,
              border: "none", padding: "10px 18px",
              fontFamily: fontLabel, fontSize: 11, fontWeight: 600,
              letterSpacing: "0.18em", textTransform: "uppercase",
              cursor: "pointer", borderRadius: 12,
            }}
          >
            Installer
          </button>
          <button
            onClick={handleDismiss}
            style={{
              background: "transparent", color: subtle,
              border: "none", padding: "10px 8px",
              fontFamily: fontLabel, fontSize: 11, fontWeight: 500,
              letterSpacing: "0.15em", textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Plus tard
          </button>
        </div>
      </aside>

      {/* Modal iOS — guide pas-à-pas pour Safari */}
      {showIOSGuide && (
        <div
          role="dialog"
          aria-label="Installation iOS"
          onClick={() => setShowIOSGuide(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(31, 27, 22, 0.62)",
            zIndex: 2000,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: paper, maxWidth: 420, width: "100%",
              padding: 28, border: `1px solid ${ink}`,
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            }}
          >
            <button
              onClick={() => setShowIOSGuide(false)}
              aria-label="Fermer"
              style={{
                // Brief audit mobile §4 : 44×44 minimum tactile.
                float: "right",
                minWidth: 44, minHeight: 44,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "transparent", border: "none",
                cursor: "pointer", color: subtle, fontSize: 22, padding: 0,
                margin: "-12px -12px 0 0",
              }}
            >
              ✕
            </button>
            <p style={{
              fontFamily: fontLabel, fontSize: 9, letterSpacing: "0.35em",
              textTransform: "uppercase", color: mojo, fontWeight: 700, margin: "0 0 10px",
            }}>
              iOS Safari · 3 étapes
            </p>
            <h3 style={{
              fontFamily: fontHeading, fontSize: 24, fontStyle: "italic", fontWeight: 500,
              margin: "0 0 18px", color: ink, lineHeight: 1.2,
            }}>
              Installer WADA sur iPhone
            </h3>
            <ol style={{
              fontSize: 14, color: ink, margin: "0 0 18px", paddingLeft: 0,
              listStyle: "none", lineHeight: 1.7,
            }}>
              <li style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                <span style={{ fontFamily: fontHeading, fontSize: 16, fontStyle: "italic", color: mojo, fontWeight: 600, minWidth: 24 }}>1.</span>
                <span>Appuyez sur le bouton <strong>Partager</strong> en bas de Safari <span aria-hidden style={{ fontSize: 18 }}>⎙</span></span>
              </li>
              <li style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                <span style={{ fontFamily: fontHeading, fontSize: 16, fontStyle: "italic", color: mojo, fontWeight: 600, minWidth: 24 }}>2.</span>
                <span>Faites défiler et choisissez <strong>"Sur l'écran d'accueil"</strong></span>
              </li>
              <li style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <span style={{ fontFamily: fontHeading, fontSize: 16, fontStyle: "italic", color: mojo, fontWeight: 600, minWidth: 24 }}>3.</span>
                <span>Confirmez avec <strong>"Ajouter"</strong> en haut à droite</span>
              </li>
            </ol>
            <button
              onClick={() => setShowIOSGuide(false)}
              style={{
                background: ink, color: paper,
                border: "none", padding: "10px 20px", width: "100%",
                fontFamily: fontLabel, fontSize: 11, fontWeight: 600,
                letterSpacing: "0.2em", textTransform: "uppercase",
                cursor: "pointer", borderRadius: 12,
              }}
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </>
  );
}
