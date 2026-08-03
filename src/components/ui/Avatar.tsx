const GRADIENTS = [
  ["#5e5ce6", "#bf5af2"],
  ["#007aff", "#30b0c7"],
  ["#ff9500", "#ff2d55"],
  ["#34c759", "#30b0c7"],
  ["#ff2d55", "#af52de"],
  ["#0a84ff", "#5e5ce6"],
  ["#ff9f0a", "#ffcc00"],
  ["#30d158", "#64d2ff"],
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
  const style: React.CSSProperties = {
    width: size,
    height: size,
    fontSize: Math.round(size * 0.4),
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
      style={{ ...style, backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
      className="rounded-full shrink-0 select-none flex items-center justify-center font-semibold text-white"
    >
      {initials(name)}
    </div>
  );
}
