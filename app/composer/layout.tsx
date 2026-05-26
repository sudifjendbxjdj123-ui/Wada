import { pageMetadata } from "@/lib/pageMetadata";

// Refonte 2026-05-21 : cette route est désormais le mode "Un vêtement"
// du Scanner (toggle ScanModeToggle). On ne l'appelle plus "Composer une
// tenue" — ce libellé est réservé au tile /atelier qui pointe vers /palettes.
export const metadata = pageMetadata({
  path: "/composer",
  title: "Scanner un vêtement",
  description: "Photographiez une pièce que vous possédez. WADA détecte sa couleur, la rattache à un accord Sanzo Wada, et compose les pièces manquantes. Tout reste sur votre appareil.",
});

export default function ComposerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
