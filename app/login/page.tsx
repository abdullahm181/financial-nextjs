"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.toLowerCase().trim(), password }),
      });

      const data = await res.json();

      if (data.success) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(data.message || "Gagal Login: Username atau password salah.");
      }
    } catch (err) {
      setError("Gagal Login: Terjadi kesalahan koneksi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-6 selection:bg-emerald-500/30 dark:bg-zinc-950">
      <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
        
        {/* Branding Area */}
        <div className="flex flex-col items-center gap-2 text-center group">
          <div className="h-16 w-16 rounded-3xl bg-emerald-500 shadow-xl shadow-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
              <path d="M12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
              <path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v14.25c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 19.125V4.875ZM12 17.25a.75.75 0 0 1-.75-.75V15a.75.75 0 0 1 1.5 0v1.5a.75.75 0 0 1-.75.75ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15ZM3.375 6h17.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125H3.375c-.621 0-1.125-.504-1.125-1.125V7.125C2.25 6.504 2.754 6 3.375 6Z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="mt-6 text-2xl font-black tracking-tight text-zinc-900 dark:text-white uppercase tracking-widest">Financial Sarimin</h2>
          <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest italic animate-pulse">Sistem Pelaporan Mandiri</p>
        </div>

        {/* Login Form Box */}
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 relative overflow-hidden group">
           {/* Decorative elements */}
           <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-emerald-500/5 blur-3xl group-focus-within:bg-emerald-500/10 transition-colors" />

           <form onSubmit={handleLogin} className="space-y-6 relative">
            <div>
              <label htmlFor="username" className="block text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1 mb-2">Username</label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                autoFocus
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-2xl border border-zinc-100 bg-zinc-50/50 px-4 py-3.5 text-sm font-medium outline-none transition-all placeholder:text-zinc-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                placeholder="Masukkan Username..."
              />
            </div>

            <div>
              <label htmlFor="pw" className="block text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1 mb-2">Password</label>
              <input
                id="pw"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-zinc-100 bg-zinc-50/50 px-4 py-3.5 text-sm font-medium outline-none transition-all placeholder:text-zinc-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                placeholder="••••••••••••"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-xs font-bold text-rose-500 animate-in fade-in zoom-in-95 dark:border-rose-500/30">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-8 py-4 text-sm font-black text-white transition-all hover:bg-zinc-800 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-zinc-950/20 disabled:opacity-50 dark:bg-emerald-500 dark:text-white dark:hover:bg-emerald-600 dark:focus:ring-emerald-500/20"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              ) : (
                <>
                  <span>MASUK</span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M2 8a.75.75 0 0 1 .75-.75h8.69L8.22 4.03a.75.75 0 0 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06-1.06l3.22-3.22H2.75A.75.75 0 0 1 2 8Z" clipRule="evenodd" /></svg>
                </>
              )}
            </button>
           </form>
        </div>

        <div className="text-center">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">
                Copyright © 2026 Sarimin Team
            </p>
        </div>

      </div>
    </div>
  );
}
