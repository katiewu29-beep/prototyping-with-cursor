"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactNode } from "react";

const subscribe = () => () => {};

/**
 * Link back to the prototypes home. Renders nothing when the URL carries
 * `?portfolio`, so a prototype can be shown standalone from an outside site.
 * Stays hidden until the URL is read in the browser to avoid a flash.
 */
export default function BackLink({
  className,
  children,
  "aria-label": ariaLabel,
}: {
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
}) {
  const show = useSyncExternalStore(
    subscribe,
    () => !new URLSearchParams(window.location.search).has("portfolio"),
    () => false,
  );

  if (!show) return null;

  return (
    <Link href="/" className={className} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}
