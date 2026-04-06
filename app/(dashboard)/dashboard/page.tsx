export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Welcome back. Here&apos;s an overview of your finances.
        </p>
      </div>

      {/* Placeholder cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["Total Balance", "Income", "Expenses", "Savings"].map((label) => (
          <div
            key={label}
            className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              $0.00
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
