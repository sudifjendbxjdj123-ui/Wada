"use client";
/**
 * ConditionalCategoryNav — Cache la Bar 2 sur /scanner et /composer
 * (même logique que ConditionalNav pour le mode caméra plein écran).
 */
import { usePathname } from "next/navigation";
import { CategoryNav } from "./CategoryNav";

const HIDDEN_PATHS = ["/scanner", "/composer"];

export function ConditionalCategoryNav() {
  const pathname = usePathname();
  if (HIDDEN_PATHS.some((p) => pathname.startsWith(p))) return null;
  return <CategoryNav />;
}
