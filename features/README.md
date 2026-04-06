# Features Directory

Each **feature** is a self-contained module representing a domain concept.

## Convention

```
features/
  transactions/
    components/        # Feature-specific components
      transaction-table.tsx
      transaction-form.tsx
    hooks/             # Feature-specific hooks
      use-transactions.ts
    types/             # Feature-specific types
      transaction.ts
    actions/           # Server actions (Next.js)
      create-transaction.ts
    index.ts           # Public API barrel export
  budgets/
    ...
```

## Rules

1. **Each feature exports its public API via `index.ts`** — other code imports from
   `@/features/transactions`, never from internal files.
2. **Feature-specific components stay inside the feature** — only truly shared
   components go in the top-level `components/` directory.
3. **Cross-feature imports are discouraged** — if two features need to share logic,
   extract it into `lib/` or `hooks/`.
