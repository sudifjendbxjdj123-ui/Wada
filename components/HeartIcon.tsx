const BORDEAUX = "#6B3A32";

export function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      aria-hidden
      fill={filled ? BORDEAUX : "none"}
      stroke={filled ? BORDEAUX : "#5a5a5a"}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transition: "transform 0.2s cubic-bezier(.22,1.4,.36,1), fill 0.2s, stroke 0.2s",
        transform: filled ? "scale(1.12)" : "scale(1)",
      }}
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}
