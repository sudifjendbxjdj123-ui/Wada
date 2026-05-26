/**
 * WADA — Bridge natif Capacitor
 * ────────────────────────────────────────────────────────────────────────
 * Helpers qui détectent si l'app tourne dans le wrapper Capacitor (iOS /
 * Android) et exposent les API natives au code de l'app. En contexte web
 * pur, chaque helper retombe gracieusement sur l'équivalent navigateur ou
 * renvoie `null` — aucun code appelant ne casse selon la plateforme.
 *
 * Charge les modules Capacitor de manière paresseuse (dynamic import) :
 *   - Le build Next.js web ne tire jamais le code natif dans son bundle
 *   - Les plugins ne sont sollicités que sur device, après détection runtime
 * ──────────────────────────────────────────────────────────────────── */

/** True si la page tourne à l'intérieur d'un wrapper Capacitor natif. */
export function isNative(): boolean {
  if (typeof window === "undefined") return false;
  // L'objet Capacitor est injecté par le bridge natif. Sur web pur il
  // peut exister mais avec `isNativePlatform()` → false (Capacitor PWA mode).
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

/** Plateforme courante. "web" couvre desktop ET PWA navigateur. */
export function getPlatform(): "web" | "ios" | "android" {
  if (typeof window === "undefined") return "web";
  const cap = (window as unknown as { Capacitor?: { getPlatform?: () => string } }).Capacitor;
  const p = cap?.getPlatform?.();
  if (p === "ios" || p === "android") return p;
  return "web";
}

/* ──────────────────────────────────────────────────────────────────────
   CAMERA — capture une photo via la caméra native, retourne une dataURL
   ────────────────────────────────────────────────────────────────────── */

/**
 * Ouvre la caméra native pour prendre une photo. Retourne une dataURL
 * `data:image/jpeg;base64,...` que l'on peut passer à `new Image()` ou
 * extraire pixel par pixel comme une URL d'objet.
 *
 * Retourne `null` si :
 *   - On n'est pas en natif (le code appelant doit alors fallback sur
 *     `<input type=file capture=environment>`)
 *   - L'utilisateur a annulé la prise de vue
 *   - La permission caméra a été refusée
 */
export async function takeNativePhoto(): Promise<string | null> {
  if (!isNative()) return null;
  try {
    // @ts-ignore — résolu au runtime sur device, optionnel au build web
    const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
    const photo = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
      width: 1024, // suffisant pour échantillonner la couleur dominante
      height: 1024,
    });
    return photo.dataUrl ?? null;
  } catch (err) {
    // Annulation utilisateur ou permission refusée — silencieux côté app
    if (typeof console !== "undefined") console.debug("[native] takeNativePhoto:", err);
    return null;
  }
}

/* ──────────────────────────────────────────────────────────────────────
   BROWSER — ouvre une URL externe dans le navigateur in-app Capacitor
   ────────────────────────────────────────────────────────────────────── */

/**
 * Ouvre une URL externe (lien d'affiliation, marchand) dans le navigateur
 * in-app Capacitor (SFSafariViewController iOS / Custom Tabs Android) si
 * dispo, sinon `window.open` en fallback web.
 *
 * Important pour les liens d'affiliation : SFSafariViewController garde les
 * cookies Awin / Amazon Associates → le tracking de commission fonctionne.
 */
export async function openExternal(url: string): Promise<void> {
  if (isNative()) {
    try {
      // @ts-ignore — résolu au runtime sur device, optionnel au build web
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({ url, presentationStyle: "popover" });
      return;
    } catch (err) {
      if (typeof console !== "undefined") console.debug("[native] openExternal:", err);
    }
  }
  if (typeof window !== "undefined") window.open(url, "_blank", "noopener,noreferrer");
}

/* ──────────────────────────────────────────────────────────────────────
   HAPTICS — feedback tactile pour les actions importantes
   ────────────────────────────────────────────────────────────────────── */

/** Vibration légère — confirme une sélection (swatch, palette). */
export async function hapticLight(): Promise<void> {
  if (!isNative()) return;
  try {
    // @ts-ignore — résolu au runtime sur device, optionnel au build web
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch { /* no-op */ }
}

/** Vibration moyenne — confirme une action (scan réussi, ajout panier). */
export async function hapticMedium(): Promise<void> {
  if (!isNative()) return;
  try {
    // @ts-ignore — résolu au runtime sur device, optionnel au build web
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch { /* no-op */ }
}

/* ──────────────────────────────────────────────────────────────────────
   SHARE — partage natif (Insta, Messages, etc.) d'une palette/tenue
   ────────────────────────────────────────────────────────────────────── */

/** Ouvre la feuille de partage native (iOS share sheet / Android intent). */
export async function shareNative(opts: { title: string; text?: string; url?: string }): Promise<boolean> {
  if (isNative()) {
    try {
      // @ts-ignore — résolu au runtime sur device, optionnel au build web
      const { Share } = await import("@capacitor/share");
      await Share.share({ title: opts.title, text: opts.text, url: opts.url, dialogTitle: opts.title });
      return true;
    } catch { /* annulation utilisateur — return false */ }
    return false;
  }
  // Web : Web Share API si dispo (mobile Safari, Chrome Android)
  const nav = typeof navigator !== "undefined" ? (navigator as Navigator & { share?: (d: unknown) => Promise<void> }) : null;
  if (nav?.share) {
    try { await nav.share({ title: opts.title, text: opts.text, url: opts.url }); return true; }
    catch { return false; }
  }
  return false;
}
