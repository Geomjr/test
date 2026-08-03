import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 22, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export const HouseIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3.5 10.5 12 3.5l8.5 7" />
    <path d="M5.5 9v10a1.5 1.5 0 0 0 1.5 1.5h3v-6h4v6h3a1.5 1.5 0 0 0 1.5-1.5V9" />
  </svg>
);

export const PeopleIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8.5" r="3.2" />
    <path d="M2.8 19.5c.7-3 3.2-4.8 6.2-4.8s5.5 1.8 6.2 4.8" />
    <path d="M15.5 5.6a3.1 3.1 0 1 1 .8 6.1" />
    <path d="M17.4 14.9c2.1.4 3.5 1.9 4 4" />
  </svg>
);

export const ColumnsIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3.5" y="4" width="5" height="16" rx="1.5" />
    <rect x="10.5" y="4" width="5" height="11" rx="1.5" />
    <rect x="17.5" y="4" width="3" height="8" rx="1.5" />
  </svg>
);

export const SearchIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="10.5" cy="10.5" r="6.2" />
    <path d="m15.3 15.3 5 5" />
  </svg>
);

export const EllipsisIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="5" cy="12" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="19" cy="12" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

export const PlusIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const ChevronRightIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m9 5.5 6.5 6.5L9 18.5" />
  </svg>
);

export const ChevronLeftIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M15 5.5 8.5 12 15 18.5" />
  </svg>
);

export const CheckIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m4.5 12.5 5 5 10-11" />
  </svg>
);

export const CircleIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
  </svg>
);

export const CheckCircleIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" fill="currentColor" stroke="none" />
    <path d="m8.2 12.4 2.6 2.6 5-5.6" stroke="var(--bg-card)" />
  </svg>
);

export const MicIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="9" y="3.5" width="6" height="11" rx="3" />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" />
    <path d="M12 18v2.5" />
  </svg>
);

export const WaveformIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 10v4M8 7v10M12 4.5v15M16 7v10M20 10v4" />
  </svg>
);

export const PlayIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M8 5.5v13l10-6.5z" fill="currentColor" stroke="none" />
  </svg>
);

export const PauseIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="7" y="5.5" width="3.4" height="13" rx="1" fill="currentColor" stroke="none" />
    <rect x="13.6" y="5.5" width="3.4" height="13" rx="1" fill="currentColor" stroke="none" />
  </svg>
);

export const TrashIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4.5 6.5h15M9.5 6V4.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V6" />
    <path d="M6.5 6.5 7.4 19a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-12.5" />
    <path d="M10 10.5v6M14 10.5v6" />
  </svg>
);

export const CalendarIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" />
  </svg>
);

export const SparklesIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path
      d="M12 4.5c.5 2.9 1.7 4.1 4.6 4.6-2.9.5-4.1 1.7-4.6 4.6-.5-2.9-1.7-4.1-4.6-4.6 2.9-.5 4.1-1.7 4.6-4.6Z"
      fill="currentColor"
      stroke="none"
    />
    <path
      d="M6 13.5c.3 1.9 1.1 2.7 3 3-1.9.3-2.7 1.1-3 3-.3-1.9-1.1-2.7-3-3 1.9-.3 2.7-1.1 3-3Z"
      fill="currentColor"
      stroke="none"
    />
    <path
      d="M17.5 14.5c.25 1.5.9 2.15 2.4 2.4-1.5.25-2.15.9-2.4 2.4-.25-1.5-.9-2.15-2.4-2.4 1.5-.25 2.15-.9 2.4-2.4Z"
      fill="currentColor"
      stroke="none"
    />
  </svg>
);

export const ChartBarIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 20V13M9.3 20V4.5M14.6 20v-9M20 20V8" />
  </svg>
);

export const ChecklistIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m3.5 6.5 1.6 1.6 3-3.4" />
    <path d="M11.5 7h9" />
    <path d="m3.5 14.5 1.6 1.6 3-3.4" />
    <path d="M11.5 15h9" />
  </svg>
);

export const GearIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2.8 13.6 5h1.9l1.4-1 1.6 1.6-.4 2.2 1 1 2.1.6v2.8l-2.1.6-1 1 .4 2.2-1.6 1.6-2.2-.4-1 1-.6 2.1h-2.8l-.6-2.1-1-1-2.2.4-1.6-1.6.4-2.2-1-1-2.1-.6v-2.8l2.1-.6 1-1L5.2 6l1.6-1.6 2.2.4 1-1z" />
  </svg>
);

export const ImportIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3.5v10M8.5 10 12 13.5 15.5 10" />
    <path d="M4.5 14.5v3.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3.5" />
  </svg>
);

export const ExportIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 13.5V3.5M8.5 7 12 3.5 15.5 7" />
    <path d="M4.5 14.5v3.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3.5" />
  </svg>
);

export const PencilIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m14.5 5 4.5 4.5L8.5 20H4v-4.5z" />
    <path d="m12.5 7 4.5 4.5" />
  </svg>
);

export const XMarkIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

export const PhoneIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5.5 4h3l1.5 4-2 1.5a12 12 0 0 0 6.5 6.5L16 14l4 1.5v3a1.5 1.5 0 0 1-1.6 1.5C10.6 19.4 4.6 13.4 4 5.6A1.5 1.5 0 0 1 5.5 4Z" />
  </svg>
);

export const CupIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 8.5h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z" />
    <path d="M16 9.5h1.5a2.5 2.5 0 0 1 0 5H16" />
    <path d="M8 3.5c0 1-1 1.5-1 2.5M11.5 3.5c0 1-1 1.5-1 2.5" />
  </svg>
);

export const MealIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 3.5v6a2 2 0 0 0 4 0v-6M9 3.5V20.5" />
    <path d="M17 3.5c-1.7 1-2.5 3.4-2.5 6.5 0 1.5 1 2 2.5 2v8.5M17 3.5v17" />
  </svg>
);

export const BubbleIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 4c4.7 0 8.5 3.1 8.5 7s-3.8 7-8.5 7c-1 0-1.9-.1-2.8-.4L5 19.5l1.1-3.2C4.5 15 3.5 13.1 3.5 11c0-3.9 3.8-7 8.5-7Z" />
  </svg>
);

export const StarIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m12 4 2.3 4.9 5.2.7-3.8 3.7.9 5.2L12 16l-4.6 2.5.9-5.2-3.8-3.7 5.2-.7z" />
  </svg>
);

export const LinkIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M10 14a4.5 4.5 0 0 0 6.4.4l2.8-2.8a4.5 4.5 0 0 0-6.4-6.4L11.6 6.4" />
    <path d="M14 10a4.5 4.5 0 0 0-6.4-.4l-2.8 2.8a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2" />
  </svg>
);

export const EnvelopeIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
    <path d="m4.5 7.5 7.5 5.5 7.5-5.5" />
  </svg>
);

export const PersonIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.8 20c.9-3.6 3.9-5.6 7.2-5.6s6.3 2 7.2 5.6" />
  </svg>
);

export const SwapIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 4.5 3.5 8 7 11.5M3.5 8h13" />
    <path d="m17 12.5 3.5 3.5-3.5 3.5M20.5 16h-13" />
  </svg>
);

export const BookIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 6.5c-1.6-1.6-4-2-8-2v13.8c4 0 6.4.5 8 2 1.6-1.5 4-2 8-2V4.5c-4 0-6.4.4-8 2Z" />
    <path d="M12 6.5v13.8" />
  </svg>
);

export const ArrowRightIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 12h16M13.5 5.5 20 12l-6.5 6.5" />
  </svg>
);

export const ArrowUpIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 20V4M5.5 10.5 12 4l6.5 6.5" />
  </svg>
);

export const BellIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 4a5.5 5.5 0 0 0-5.5 5.5c0 4.5-1.5 5.6-2.5 6.5h16c-1-.9-2.5-2-2.5-6.5A5.5 5.5 0 0 0 12 4Z" />
    <path d="M10 19.5a2 2 0 0 0 4 0" />
  </svg>
);
