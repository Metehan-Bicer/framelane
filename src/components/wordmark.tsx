import Link from "next/link";

/** Four corner marks around a rounded screen: a frame being composed. */
export function FrameMark({ className = "size-7" }: { className?: string }) {
  return (
    <span className={`grid place-items-center rounded-[9px] bg-accent text-white shadow-soft ${className}`} aria-hidden>
      <svg viewBox="0 0 20 20" fill="none" className="size-[62%]">
        <path d="M3 7V3h4M13 3h4v4M17 13v4h-4M7 17H3v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <rect x="7.5" y="6" width="5" height="8" rx="1.5" fill="currentColor" />
      </svg>
    </span>
  );
}

export function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2.5 text-ink">
      <FrameMark />
      <span className="text-[15px] font-semibold tracking-tight">Framelane</span>
    </Link>
  );
}
