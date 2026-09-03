export default function Loader({ label = "Loading", fullScreen = true }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${fullScreen ? "min-h-screen w-full" : "py-24"}`}
      style={{ background: fullScreen ? "var(--color-ivory)" : "transparent" }}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="relative flex items-center justify-center" style={{ width: 84, height: 84 }}>
        <span
          className="absolute inset-0 rounded-full animate-spin"
          style={{
            border: "2px solid color-mix(in srgb, var(--color-gold) 22%, transparent)",
            borderTopColor: "var(--color-gold)",
          }}
        />
        <img
          src="/images/logo.png"
          alt=""
          width={52}
          height={52}
          className="object-contain animate-breathe"
        />
      </div>
      <span
        className="font-mono text-[10px] tracking-[0.32em] uppercase"
        style={{ color: "color-mix(in srgb, var(--color-navy) 55%, transparent)" }}
      >
        {label}
      </span>
    </div>
  );
}
