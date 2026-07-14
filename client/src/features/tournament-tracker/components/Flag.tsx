import type { CSSProperties } from "react";
import { iocToAlpha2 } from "../iocToAlpha2";

/**
 * IOC code (e.g. "CRO") -> ISO alpha-2, lowercased for flag-icons class names
 * (e.g. "hr" -> `fi fi-hr`). Returns null when the country is empty/unmapped.
 */
export function flagAlpha2(ioc?: string): string | null {
  return (ioc && iocToAlpha2[ioc.toUpperCase()]?.toLowerCase()) || null;
}

/**
 * Renders a flag-icons flag for an IOC country code. Returns null (renders
 * nothing) when the code is empty or unmapped — callers that need a placeholder
 * should handle the null case themselves.
 */
export function Flag({
  ioc,
  style,
  className = "",
}: {
  ioc?: string;
  style?: CSSProperties;
  className?: string;
}) {
  const alpha2 = flagAlpha2(ioc);
  if (!alpha2) return null;
  return (
    <span
      className={`fi fi-${alpha2} ${className}`.trim()}
      title={ioc}
      style={style}
    />
  );
}
