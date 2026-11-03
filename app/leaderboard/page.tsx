
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Player = {
  id: string;
  username: string;
  best_wpm: number;
  best_accuracy: number;
  tests_completed: number;
};

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLeaderboard() {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, best_wpm, best_accuracy, tests_completed")
        .order("best_wpm", { ascending: false })
        .limit(100);

      if (error) {
        setError(error.message);
      } else {
        setPlayers(data || []);
      }

      setLoading(false);
    }

    loadLeaderboard();
  }, []);

  return (
    <main className="min-h-screen bg-[#08090d] px-5 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="text-3xl font-black tracking-[0.2em] text-violet-400"
        >
          TYPEX
        </Link>

        <div className="mt-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-400">
            Global Rankings
          </p>

          <h1 className="mt-3 text-4xl font-black sm:text-5xl">
            Leaderboard
          </h1>

          <p className="mt-3 text-gray-400">
            Compete with typists around the world.
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          <div className="grid grid-cols-[55px_1fr_75px_85px] gap-2 border-b border-white/10 bg-white/[0.04] px-4 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400 sm:grid-cols-[70px_1fr_100px_120px_120px]">
            <span>Rank</span>
            <span>Player</span>
            <span className="text-right">WPM</span>
            <span className="hidden text-right sm:block">Accuracy</span>
            <span className="text-right">Tests</span>
          </div>

          {loading ? (
            <p className="p-10 text-center text-gray-400">
              Loading leaderboard...
            </p>
          ) : error ? (
            <p className="p-10 text-center text-red-400">
              {error}
            </p>
          ) : players.length === 0 ? (
            <p className="p-10 text-center text-gray-400">
              No players yet. Be the first to join TYPEX!
            </p>
          ) : (
            players.map((player, index) => (
              <div
                key={player.id}
                className="grid grid-cols-[55px_1fr_75px_85px] gap-2 border-b border-white/5 px-4 py-5 transition hover:bg-white/[0.04] sm:grid-cols-[70px_1fr_100px_120px_120px]"
              >
                <span className="font-bold text-violet-400">
                  #{index + 1}
                </span>

                <span className="truncate font-semibold">
                  {player.username}
                </span>

                <span className="text-right font-bold">
                  {player.best_wpm}
                </span>

                <span className="hidden text-right text-gray-300 sm:block">
                  {Number(player.best_accuracy).toFixed(1)}%
                </span>

                <span className="text-right text-gray-400">
                  {player.tests_completed}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/signup"
            className="inline-block rounded-xl bg-violet-600 px-7 py-3 font-semibold transition hover:bg-violet-500"
          >
            Join TYPEX
          </Link>
        </div>

        <div className="mt-12 text-center text-sm text-gray-600">
          Developed by Sahariya Ahmed Musa
        </div>
      </div>
    </main>
  );
}
