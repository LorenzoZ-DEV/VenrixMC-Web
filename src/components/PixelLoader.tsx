export function PixelLoader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="venrix-pixel-dot h-2.5 w-2.5 bg-venrix-500"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      {label && (
        <p className="font-display text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
      )}
    </div>
  );
}
