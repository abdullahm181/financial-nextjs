import Link from "next/link";
import { siteConfig } from "@/config";
import { ROUTES } from "@/lib";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/80 backdrop-blur-lg dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          href={ROUTES.home}
          className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          {siteConfig.name}
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link
            href={ROUTES.dashboard}
            className="text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
