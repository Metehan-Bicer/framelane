import { FileText, Images, LayoutGrid, Send } from "lucide-react";
import Link from "next/link";

const items = [
  { href: "/", label: "Apps", icon: LayoutGrid, ready: true },
  { href: "#", label: "Screenshots", icon: Images, ready: false },
  { href: "#", label: "Metadata", icon: FileText, ready: false },
  { href: "#", label: "Publish", icon: Send, ready: false },
];

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-surface px-4 py-6 md:block">
      <Link href="/" className="flex items-center gap-2 px-2 text-lg font-semibold tracking-tight">
        <span className="grid size-7 place-items-center rounded-lg bg-accent text-sm text-white">F</span>
        Framelane
      </Link>
      <nav className="mt-8 flex flex-col gap-1">
        {items.map(({ href, label, icon: Icon, ready }) =>
          ready ? (
            <Link
              key={label}
              href={href}
              className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium hover:bg-background"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ) : (
            <span
              key={label}
              className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-muted"
              aria-disabled
            >
              <Icon className="size-4" />
              {label}
              <span className="ml-auto rounded bg-background px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                Soon
              </span>
            </span>
          ),
        )}
      </nav>
    </aside>
  );
}
