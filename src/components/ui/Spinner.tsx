export function Spinner({ size = 20 }: { size?: number }) {
  const blades = Array.from({ length: 8 });
  return (
    <div
      role="status"
      aria-label="Loading"
      className="relative inline-block"
      style={{ width: size, height: size }}
    >
      {blades.map((_, i) => (
        <div
          key={i}
          className="absolute left-1/2 top-1/2 origin-center rounded-full bg-label-2"
          style={{
            width: size * 0.09,
            height: size * 0.28,
            transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(${-size * 0.32}px)`,
            opacity: 0.15 + (i / 8) * 0.7,
            animation: `spinner-fade 0.8s linear ${i * 0.1}s infinite`,
          }}
        />
      ))}
      <style>{`@keyframes spinner-fade { from { opacity: 0.85; } to { opacity: 0.15; } }`}</style>
    </div>
  );
}
