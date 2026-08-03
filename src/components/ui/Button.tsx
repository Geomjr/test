"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "./Spinner";

type Variant = "filled" | "tinted" | "plain" | "destructive" | "gray";

const STYLES: Record<Variant, string> = {
  filled: "bg-tint text-white",
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
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`pressable inline-flex items-center justify-center gap-2 rounded-[12px] font-semibold disabled:opacity-40 ${
        small ? "min-h-[34px] px-3.5 text-[15px] rounded-[10px]" : "min-h-[48px] px-5 text-[17px]"
      } ${block ? "w-full" : ""} ${STYLES[variant]} ${className}`}
    >
      {loading ? <Spinner size={16} /> : null}
      {children}
    </button>
  );
}
