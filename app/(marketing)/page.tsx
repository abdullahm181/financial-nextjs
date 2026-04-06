import Link from "next/link";
import { ROUTES } from "@/lib";

export default function MarketingHome() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-zinc-50 to-white px-6 dark:from-zinc-950 dark:to-black">
      <main className="flex max-w-2xl flex-col items-center gap-8 text-center">
        {/* Hero */}
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
          Take Control of Your{" "}
          <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
            Finances
          </span>
        </h1>

        <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Track spending, manage budgets, and grow your wealth — all in one
          place.
        </p>

        {/* CTA */}
        <div className="flex gap-4">
          <Link
            href={ROUTES.dashboard}
            className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Go to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
