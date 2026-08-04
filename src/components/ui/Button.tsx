"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "./Spinner";

type Variant = "filled" | "tinted" | "plain" | "destructive" | "gray";

const STYLES: Record<Variant, string> = {
  filled: "btn-primary",
  tinted: "bg-tint-soft text-tint",
  plain: "text-tint",
  destructive: "bg-red-soft text-red",
  gray: "bg-fill text-label",
};

export function Button({
  variant = "filled",
  small,
  loading,
  block,
  children,
  className = "",
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  small?: boolean;
  loading?: boolean;
  block?: boolean;
  children: ReactNode;
}) {
  // A faded charcoal pill reads as a dead gray slab on ivory — disabled
  // filled buttons go quiet instead. Loading keeps the confident fill.
  const quietDisabled = disabled && !loading && variant === "filled";
  const look = quietDisabled
    ? "bg-fill text-label-3"
    : `${STYLES[variant]}${loading ? "" : " disabled:opacity-40"}`;
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`pressable inline-flex items-center justify-center gap-2 font-semibold tracking-[-0.01em] ${
        small
          ? "min-h-[36px] rounded-full px-4 text-[15px]"
          : "min-h-[50px] rounded-full px-7 text-[17px]"
      } ${block ? "w-full" : ""} ${look} ${className}`}
    >
      {loading ? <Spinner size={16} /> : null}
      {children}
    </button>
  );
}
