"use client";

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = "",
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={`flex rounded-[9px] bg-fill p-[2px] ${className}`}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={selected}
            type="button"
            onClick={() => onChange(option.value)}
            className={`min-h-[32px] flex-1 rounded-[7px] px-2 text-[13px] font-medium transition-all ${
              selected ? "bg-card shadow-sm" : "text-label-2"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
