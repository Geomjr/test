"use client";

import type { InputHTMLAttributes } from "react";
import { SearchIcon, XMarkIcon } from "./icons";

export function SearchBar({
  value,
  onValueChange,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <div className="search-field flex h-[42px] items-center gap-2 rounded-[13px] bg-fill px-3">
      <SearchIcon size={17} className="shrink-0 text-label-2" strokeWidth={2.2} />
      <input
        type="search"
        placeholder="Search"
        enterKeyHint="search"
        autoCapitalize="none"
        autoCorrect="off"
        {...rest}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-label-3 [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onValueChange("")}
          className="pressable flex h-5 w-5 items-center justify-center rounded-full bg-label-3 text-card"
        >
          <XMarkIcon size={11} strokeWidth={3} />
        </button>
      ) : null}
    </div>
  );
}
