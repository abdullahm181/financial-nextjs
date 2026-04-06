import { Header } from "@/components";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <div className="flex flex-1">
        {/* Sidebar placeholder — replace with a real sidebar component */}
        <aside className="hidden w-64 shrink-0 border-r border-zinc-200 bg-zinc-50 p-4 lg:block dark:border-zinc-800 dark:bg-zinc-950">
          <nav className="flex flex-col gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <span className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Menu
            </span>
            <a
              href="/dashboard"
              className="rounded-lg px-3 py-2 transition-colors hover:bg-zinc-200/60 hover:text-zinc-900 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-50"
            >
              Overview
            </a>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
