import Link from "next/link";
import type { CSSProperties, ComponentPropsWithoutRef, ReactNode } from "react";
import { ink, paper } from "@/lib/styles";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "sm";

const baseStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  letterSpacing: "0.4em",
  textTransform: "uppercase",
  textDecoration: "none",
  fontFamily: "'Inter', sans-serif",
  fontWeight: 600,
  cursor: "pointer",
  border: "none",
};

const variantStyles: Record<Variant, CSSProperties> = {
  primary: { background: ink, color: paper, border: "none" },
  secondary: { background: "transparent", color: ink, border: `1px solid ${ink}` },
  ghost: { background: "transparent", color: ink, border: "none", textDecoration: "underline", textUnderlineOffset: "4px" },
};

const sizeStyles: Record<Size, CSSProperties> = {
  md: { padding: "20px 40px" },
  sm: { padding: "12px 24px", fontSize: 11, letterSpacing: "0.3em" },
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  fullWidth?: boolean;
}

type LinkProps = CommonProps & { href: string } & Omit<ComponentPropsWithoutRef<typeof Link>, "children" | "style">;
type ButtonProps = CommonProps & { onClick?: () => void; type?: "button" | "submit" } & Omit<ComponentPropsWithoutRef<"button">, "children" | "style">;

/**
 * WADA Button — variants : primary / secondary / ghost.
 * Use as a Link if `href` is provided, otherwise a `<button>` element.
 * Hover lift universel via la classe `wada-lift-sm` (translateY -2px).
 */
export default function Button(props: LinkProps | ButtonProps) {
  const { variant = "primary", size = "md", children, fullWidth, ...rest } = props;
  const style: CSSProperties = {
    ...baseStyle,
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...(fullWidth ? { width: "100%" } : null),
  };
  const cls = "wada-lift-sm";

  if ("href" in rest && rest.href) {
    const { className, ...linkRest } = rest as LinkProps & { className?: string };
    const merged = [cls, className].filter(Boolean).join(" ");
    return (
      <Link {...linkRest} className={merged} style={style}>
        {children}
      </Link>
    );
  }
  const { className, ...btnRest } = rest as ButtonProps & { className?: string };
  const merged = [cls, className].filter(Boolean).join(" ");
  return (
    <button {...btnRest} className={merged} style={style}>
      {children}
    </button>
  );
}
