/* Harmonized earthy duotones — warm, muted, consistent depth. */
const GRADIENTS = [
  ["#dd8a5c", "#c05f36"],
  ["#d97d85", "#b0525e"],
  ["#a2a659", "#7d883b"],
  ["#d9a944", "#b5831f"],
  ["#79a99a", "#4f8878"],
  ["#b287c2", "#8c5e9e"],
  ["#7d97bf", "#54719c"],
  ["#c78a70", "#a05f45"],
];

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase();
}

export function Avatar({
  name,
  photoUrl,
  size = 40,
}: {
  name: string;
  photoUrl?: string | null;
  size?: number;
}) {
  const ring = "inset 0 1px 1px rgba(255,255,255,0.34), inset 0 -2px 4px rgba(0,0,0,0.14)";
  const style: React.CSSProperties = {
    width: size,
    height: size,
    fontSize: Math.round(size * 0.38),
  };

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- dynamic, auth-gated upload; next/image adds nothing here
      <img
        src={photoUrl}
        alt=""
        style={style}
        className="rounded-full object-cover shrink-0 select-none"
      />
    );
  }

  const [from, to] = GRADIENTS[hashName(name) % GRADIENTS.length] ?? ["#888", "#666"];
  return (
    <div
      aria-hidden
      style={{
        ...style,
        backgroundImage: `linear-gradient(140deg, ${from}, ${to})`,
        boxShadow: ring,
      }}
      className="rounded-full shrink-0 select-none flex items-center justify-center font-semibold tracking-[0.01em] text-white"
    >
      {initials(name)}
    </div>
  );
}
