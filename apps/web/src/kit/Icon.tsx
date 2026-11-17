/*
 * Icon nodes copied from the design library's icon registry, which takes them from Lucide.
 * Lucide is ISC licensed. Copyright (c) for Lucide contributors, 2022 Lucide Contributors,
 * and for Feather, 2013-2022 Cole Bemis. Permission to use, copy, modify, and/or distribute
 * this software for any purpose with or without fee is hereby granted, provided that the
 * above copyright notice and this permission notice appear in all copies.
 * The software is provided "as is" without warranty of any kind.
 */
import type { ReactNode } from "react";

const NODES = {
  inbox: (
    <>
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof NODES;

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {NODES[name]}
    </svg>
  );
}

/** The AVEL mark, from the design library's rail. */
export function BrandMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <rect
        x="1.5"
        y="1.5"
        width="15"
        height="15"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M5 12.5 9 5l4 7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6.6 10h4.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
