export function OrbitLogo({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="16" fill="#f0c93f" />
      <g transform="rotate(-18 32 32)">
        <ellipse
          cx="32"
          cy="32"
          rx="21"
          ry="14.5"
          fill="none"
          stroke="rgba(38,34,24,0.45)"
          strokeWidth="2.5"
        />
        <circle cx="32" cy="32" r="7.5" fill="#262218" />
        <circle cx="52.6" cy="27.6" r="3.6" fill="#262218" />
      </g>
    </svg>
  );
}
