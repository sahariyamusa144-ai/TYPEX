
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#08090d] text-white flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="text-3xl font-black tracking-[0.2em] text-violet-400">
          TYPEX
        </Link>

        <div className="mt-9 rounded-3xl border border-white/10 bg-white/[0.04] p-7 sm:p-9 shadow-2xl">
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="mt-2 text-gray-400">Log in to your TYPEX account.</p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm text-gray-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-[#11131a] px-4 py-3 outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Your password"
                className="w-full rounded-xl border border-white/10 bg-[#11131a] px-4 py-3 outline-none focus:border-violet-500"
              />
            </div>

            {message && (
              <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300">
                {message}
              </p>
            )}

            <button
              disabled={loading}
              className="w-full rounded-xl bg-violet-600 py-3.5 font-semibold transition hover:bg-violet-500 disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Don't have an account?{" "}
            <Link href="/signup" className="text-violet-400 hover:text-violet-300">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
