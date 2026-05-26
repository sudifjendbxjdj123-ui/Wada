import { sectionLabel, sectionTitle, subtle, seal } from "@/lib/styles";

interface SectionHeaderProps {
  label?: string;
  title: string;
  subtitle?: string;
  centered?: boolean;
}

/** En-tête de section uniformisé : label rouge sceau + h2 italique + sous-titre en italique. */
export default function SectionHeader({ label, title, subtitle, centered = true }: SectionHeaderProps) {
  return (
    <div style={{ textAlign: centered ? "center" : "left", marginBottom: 48 }}>
      {label && <p style={{ ...sectionLabel, color: seal, marginBottom: 14 }}>{label}</p>}
      <h2 className="wada-section-title" style={sectionTitle}>{title}</h2>
      {subtitle && (
        <p
          style={{
            fontSize: 14,
            color: subtle,
            fontStyle: "italic",
            marginTop: 12,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
