"use client";

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export function FormCard({ children, footer }: { children: ReactNode; footer?: string }) {
  return (
    <div className="mt-5 first:mt-0">
      <div className="overflow-hidden rounded-[10px] bg-card">{children}</div>
      {footer ? <p className="px-4 pt-1.5 text-[13px] text-label-2">{footer}</p> : null}
    </div>
  );
}

function Row({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <label className="hairline-b last:after:hidden flex min-h-[46px] items-center gap-3 px-4">
      {label ? <span className="w-[104px] shrink-0 text-[16px]">{label}</span> : null}
      {children}
    </label>
  );
}

export function TextField({
  label,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <Row label={label}>
      <input
        {...rest}
        className="min-w-0 flex-1 bg-transparent py-2.5 text-[16px] outline-none placeholder:text-label-3"
      />
    </Row>
  );
}

export function SelectField({
  label,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; children: ReactNode }) {
  return (
    <Row label={label}>
      <select
        {...rest}
        className="min-w-0 flex-1 appearance-none bg-transparent py-2.5 text-[16px] outline-none"
      >
        {children}
      </select>
    </Row>
  );
}

export function TextAreaField({
  label,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <div className="hairline-b last:after:hidden px-4 py-2.5">
      {label ? <p className="pb-1 text-[13px] text-label-2">{label}</p> : null}
      <textarea
        {...rest}
        className="min-h-[88px] w-full resize-y bg-transparent text-[16px] outline-none placeholder:text-label-3"
      />
    </div>
  );
}
