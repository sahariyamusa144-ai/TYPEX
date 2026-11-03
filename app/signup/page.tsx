
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (username.trim().length < 3) {
      setMessage("Username must be at least 3 characters.");
      return;
    }

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { username: username.trim() },
      },
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (data.session) {
      router.push("/");
      router.refresh();
    } else {
      setMessage("Account created! Please check your email to confirm your account, then log in.");
    }
  }

  return (
    <main className="min-h-screen bg-[#08090d] text-white flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="text-3xl font-black tracking-[0.2em] text-violet-400">
          TYPEX
        </Link>

        <div className="mt-9 rounded-3xl border border-white/10 bg-white/[0.04] p-7 sm:p-9 shadow-2xl">
          <h1 className="text-3xl font-bold">Create account</h1>
          <p className="mt-2 text-gray-400">Join the TYPEX typing community.</p>

          <form onSubmit={handleSignup} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm text-gray-300">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={24}
                autoComplete="username"
                placeholder="Choose a username"
                className="w-full rounded-xl border border-white/10 bg-[#11131a] px-4 py-3 outline-none focus:border-violet-500"
              />
            </div>

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
                minLength={8}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="w-full rounded-xl border border-white/10 bg-[#11131a] px-4 py-3 outline-none focus:border-violet-500"
              />
            </div>

            {message && (
              <p className="rounded-xl bg-violet-500/10 p-3 text-sm text-violet-200">
                {message}
              </p>
            )}

            <button
              disabled={loading}
              className="w-full rounded-xl bg-violet-600 py-3.5 font-semibold transition hover:bg-violet-500 disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="text-violet-400 hover:text-violet-300">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
