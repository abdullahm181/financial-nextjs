"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { ChatMessage } from "@/types";
import { cn } from "@/lib";

export default function DashboardPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom whenever messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/chat");
        const json = await res.json();
        if (json.success && json.data) {
          setMessages(json.data);
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      } finally {
        setIsInitialLoading(false);
      }
    }
    loadHistory();
  }, []);

  // Send message
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    // Optimistic update — show user message immediately
    const userMsg: ChatMessage = {
      id: Date.now(),
      sender: "user",
      message: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sender: "user" }),
      });
      const json = await res.json();

      if (json.success && json.data) {
        const botMsg: ChatMessage = {
          id: Date.now() + 1,
          sender: "bot",
          message: json.data.message,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      const errorMsg: ChatMessage = {
        id: Date.now() + 1,
        sender: "bot",
        message: "⚠️ Gagal mengirim pesan. Coba lagi.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {/* Welcome */}
          {!isInitialLoading && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-3xl dark:bg-emerald-900/30">
                💸
              </div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                Financial Tracker
              </h2>
              <p className="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
                Catat pengeluaran dengan mengetik perintah. Contoh:
              </p>
              <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 text-left text-sm dark:border-zinc-800 dark:bg-zinc-900">
                <code className="text-emerald-600 dark:text-emerald-400">
                  /catat Makan Siang 50000
                </code>
              </div>
            </div>
          )}

          {isInitialLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-50" />
            </div>
          )}

          {/* Chat bubbles */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.sender === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm sm:max-w-[70%]",
                  msg.sender === "user"
                    ? "rounded-br-md bg-emerald-600 text-white"
                    : "rounded-bl-md bg-white text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
                )}
              >
                <div className="whitespace-pre-wrap break-words">
                  {msg.message}
                </div>
                <div
                  className={cn(
                    "mt-1.5 text-[10px]",
                    msg.sender === "user"
                      ? "text-emerald-200"
                      : "text-zinc-400 dark:text-zinc-500"
                  )}
                >
                  {formatTime(msg.created_at)}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm dark:bg-zinc-800">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-2xl items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="/catat Makan Siang 50000"
            disabled={isLoading}
            className="flex-1 rounded-full border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:border-emerald-400"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white transition-all hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.114A28.897 28.897 0 0 0 3.105 2.288Z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

function formatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}
