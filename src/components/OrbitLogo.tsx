export function OrbitLogo({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <defs>
        <linearGradient id="orbit-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0a84ff" />
          <stop offset="100%" stopColor="#5e5ce6" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14.5" fill="url(#orbit-bg)" />
      <circle cx="32" cy="32" r="7" fill="#fff" />
      <ellipse
        cx="32"
        cy="32"
        rx="20"
        ry="20"
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="2.5"
      />
      <circle cx="46.5" cy="18.5" r="4.5" fill="#fff" />
    </svg>
  );
}
