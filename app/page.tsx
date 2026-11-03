"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Mode = "time" | "infinite" | "paragraph";
type Difficulty = "easy" | "medium" | "hard";

type TestResult = {
  id: number;
  date: string;
  mode: Mode;
  difficulty: Difficulty;
  duration: number;
  wpm: number;
  cpm: number;
  accuracy: number;
  correctWords: number;
  wrongWords: number;
  correctChars: number;
  wrongChars: number;
  newWpmRecord: boolean;
  newAccuracyRecord: boolean;
};

type PersonalBest = {
  wpm: number;
  accuracy: number;
};

const INITIAL_TEXT =
  "Welcome to TYPEX, your personal English typing practice platform. Improve your typing speed, build accuracy, and develop confidence with every keystroke. Keep practicing and discover how much your typing skills can improve over time.";

const templates = [
  "Every {adj} {noun} can create a {adj2} opportunity for {person}.",
  "The best way to {verb} your {noun} is to practice with {adj} {noun2}.",
  "When people {verb} together, they can achieve {adj} results.",
  "A {adj} idea can become something {adj2} with patience and effort.",
  "Learning to {verb} is an important part of personal growth and success.",
  "Sometimes the smallest {noun} can make the biggest difference in life.",
  "Technology continues to {verb} the way people work, learn, and communicate.",
  "Every day gives us another chance to {verb} something {adj}.",
  "Success often comes from {adj} habits and consistent daily practice.",
  "A curious mind always finds new ways to {verb} and explore the world.",
  "People who {verb} regularly often become more confident and creative.",
  "The journey toward a {adj} future begins with one simple step.",
  "Good communication helps people share {noun} and understand each other.",
  "Building a new skill takes time, patience, and a {adj} attitude.",
  "With enough practice, a difficult task can become surprisingly {adj}.",
  "The world is full of {adj} places waiting to be discovered.",
  "Creative thinking allows us to find {adj2} solutions to everyday problems.",
  "Each new experience teaches us something {adj} about ourselves.",
  "Small improvements every day can lead to {adj} results over time.",
  "A {noun} filled with possibilities can inspire people to think differently.",
  "Reading every day can help people develop their knowledge and imagination.",
  "A clear goal makes it easier to stay focused and keep moving forward.",
  "Good habits are built through small actions repeated consistently.",
  "The future belongs to people who are willing to learn and adapt.",
  "Every challenge is an opportunity to discover a better solution.",
];

const vocabulary = {
  adj: [
    "beautiful", "creative", "modern", "wonderful", "powerful",
    "simple", "interesting", "valuable", "positive", "important",
    "amazing", "bright", "peaceful", "successful", "unique",
    "careful", "natural", "excellent", "challenging", "exciting",
    "remarkable", "friendly", "comfortable", "intelligent",
  ],
  adj2: [
    "meaningful", "successful", "remarkable", "valuable",
    "creative", "powerful", "positive", "memorable",
    "effective", "inspiring", "extraordinary", "rewarding",
  ],
  noun: [
    "idea", "journey", "future", "opportunity", "moment",
    "dream", "project", "challenge", "experience", "community",
    "world", "decision", "skill", "story", "goal", "change",
    "adventure", "discovery", "beginning", "achievement",
  ],
  noun2: [
    "knowledge", "experience", "practice", "technology",
    "creativity", "patience", "confidence", "dedication",
    "imagination", "learning", "discipline", "determination",
  ],
  person: [
    "everyone", "young learners", "creative people",
    "our community", "future generations", "curious minds",
    "every student",
  ],
  verb: [
    "improve", "discover", "develop", "create", "understand",
    "explore", "practice", "achieve", "build", "transform",
    "design", "learn", "imagine", "communicate", "grow",
    "organize", "prepare", "inspire", "experience",
  ],
};

function randomItem<T,>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function generateSentence(difficulty: Difficulty) {
  const limit =
    difficulty === "easy" ? 10 : difficulty === "medium" ? 17 : 24;

  return randomItem(templates)
    .replace("{adj}", randomItem(vocabulary.adj.slice(0, limit)))
    .replace("{adj2}", randomItem(vocabulary.adj2.slice(0, limit)))
    .replace("{noun}", randomItem(vocabulary.noun.slice(0, limit)))
    .replace("{noun2}", randomItem(vocabulary.noun2.slice(0, limit)))
    .replace("{person}", randomItem(vocabulary.person))
    .replace("{verb}", randomItem(vocabulary.verb.slice(0, limit)));
}

function generateText(
  length = 1800,
  paragraphMode = false,
  difficulty: Difficulty = "medium"
) {
  const sentences: string[] = [];
  let totalLength = 0;

  while (totalLength < length) {
    const sentence = generateSentence(difficulty);
    sentences.push(sentence);
    totalLength += sentence.length + 1;
  }

  if (!paragraphMode) return sentences.join(" ") + " ";

  const paragraphs: string[] = [];

  for (let i = 0; i < sentences.length; i += 5) {
    paragraphs.push(sentences.slice(i, i + 5).join(" "));
  }

  return paragraphs.join("\n\n") + "\n\n";
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("time");
  const [duration, setDuration] = useState(60);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [passage, setPassage] = useState(INITIAL_TEXT);
  const [typed, setTyped] = useState("");
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [dark, setDark] = useState(true);
  const [result, setResult] = useState<TestResult | null>(null);
  const [history, setHistory] = useState<TestResult[]>([]);
  const [personalBest, setPersonalBest] = useState<PersonalBest>({
    wpm: 0,
    accuracy: 0,
  });
  const [showHistory, setShowHistory] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const [showResultDetails, setShowResultDetails] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    try {
      const savedBest = localStorage.getItem("typex-personal-best");
      const savedHistory = localStorage.getItem("typex-history");

      if (savedBest) {
        setPersonalBest(JSON.parse(savedBest));
      }

      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch {
      // Local storage may be unavailable or invalid.
    }

    setStorageReady(true);
  }, []);

  const correctCount = useMemo(() => {
    let count = 0;

    for (let i = 0; i < typed.length; i++) {
      if (typed[i] === passage[i]) count++;
    }

    return count;
  }, [typed, passage]);

  const wrongCount = typed.length - correctCount;

  const accuracy =
    typed.length > 0
      ? Math.round((correctCount / typed.length) * 100)
      : 100;

  const minutes = Math.max(elapsed, 1) / 60;
  const wpm = Math.round(correctCount / 5 / minutes);
  const cpm = Math.round(correctCount / minutes);
  const timeLeft = Math.max(0, duration - elapsed);

  const progress =
    mode === "time"
      ? Math.min(100, (elapsed / duration) * 100)
      : passage.length > 0
        ? Math.min(100, (typed.length / passage.length) * 100)
        : 0;

  const finishTest = useCallback(
    (elapsedOverride?: number) => {
      if (finishedRef.current || !started) return;

      finishedRef.current = true;

      const finalElapsed = Math.max(1, elapsedOverride ?? elapsed);

      let finalCorrect = 0;

      for (let i = 0; i < typed.length; i++) {
        if (typed[i] === passage[i]) finalCorrect++;
      }

      const finalWrong = typed.length - finalCorrect;

      const finalAccuracy =
        typed.length > 0
          ? Math.round((finalCorrect / typed.length) * 100)
          : 0;

      const finalMinutes = finalElapsed / 60;
      const finalWpm = Math.round(finalCorrect / 5 / finalMinutes);
      const finalCpm = Math.round(finalCorrect / finalMinutes);

      const typedWords = typed.trim().split(/\s+/).filter(Boolean);
      const expectedWords = passage.trim().split(/\s+/);

      let correctWords = 0;

      typedWords.forEach((word, index) => {
        if (word === expectedWords[index]) correctWords++;
      });

      const wrongWords = Math.max(0, typedWords.length - correctWords);

      const newWpmRecord = finalWpm > personalBest.wpm;
      const newAccuracyRecord =
        typed.length > 0 && finalAccuracy > personalBest.accuracy;

      const entry: TestResult = {
        id: Date.now(),
        date: new Date().toLocaleString(),
        mode,
        difficulty,
        duration: finalElapsed,
        wpm: finalWpm,
        cpm: finalCpm,
        accuracy: finalAccuracy,
        correctWords,
        wrongWords,
        correctChars: finalCorrect,
        wrongChars: finalWrong,
        newWpmRecord,
        newAccuracyRecord,
      };

      setResult(entry);
      setFinished(true);
      setElapsed(finalElapsed);
      setShowResultDetails(false);

      const updatedBest = {
        wpm: Math.max(personalBest.wpm, finalWpm),
        accuracy: Math.max(personalBest.accuracy, finalAccuracy),
      };

      setPersonalBest(updatedBest);

      const updatedHistory = [entry, ...history].slice(0, 20);
      setHistory(updatedHistory);

      try {
        localStorage.setItem(
          "typex-personal-best",
          JSON.stringify(updatedBest)
        );

        localStorage.setItem(
          "typex-history",
          JSON.stringify(updatedHistory)
        );
      } catch {
        // Results remain visible even if storage is unavailable.
      }
    },
    [
      started,
      elapsed,
      typed,
      passage,
      personalBest,
      mode,
      difficulty,
      history,
    ]
  );

  useEffect(() => {
    if (!started || finished) return;

    const interval = window.setInterval(() => {
      setElapsed((previous) => previous + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [started, finished]);

  useEffect(() => {
    if (mode === "time" && started && !finished && elapsed >= duration) {
      finishTest(duration);
    }
  }, [elapsed, duration, mode, started, finished, finishTest]);

  function playSound(correct: boolean) {
    if (!soundOn) return;

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }).webkitAudioContext;

      if (!AudioContextClass) return;

      if (!audioRef.current) {
        audioRef.current = new AudioContextClass();
      }

      const context = audioRef.current;

      if (context.state === "suspended") {
        void context.resume();
      }

      const now = context.currentTime;

      if (correct) {
        const bufferSize = Math.floor(context.sampleRate * 0.035);
        const buffer = context.createBuffer(
          1,
          bufferSize,
          context.sampleRate
        );

        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }

        const source = context.createBufferSource();
        const filter = context.createBiquadFilter();
        const gain = context.createGain();

        source.buffer = buffer;
        filter.type = "highpass";
        filter.frequency.setValueAtTime(1700, now);
        filter.Q.setValueAtTime(0.7, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.22, now + 0.003);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(context.destination);

        source.start(now);
        source.stop(now + 0.04);
      } else {
        const oscillator = context.createOscillator();
        const gain = context.createGain();

        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(190, now);
        oscillator.frequency.exponentialRampToValueAtTime(95, now + 0.14);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

        oscillator.connect(gain);
        gain.connect(context.destination);

        oscillator.start(now);
        oscillator.stop(now + 0.17);
      }
    } catch {
      // Sound is optional.
    }
  }

  function resetTest(nextMode: Mode = mode) {
    finishedRef.current = false;

    setMode(nextMode);
    setTyped("");
    setStarted(false);
    setFinished(false);
    setElapsed(0);
    setResult(null);
    setShowResultDetails(false);

    setPassage(
      nextMode === "paragraph"
        ? generateText(3000, true, difficulty)
        : generateText(2000, false, difficulty)
    );

    window.setTimeout(() => inputRef.current?.focus(), 80);
  }

  function handleTyping(value: string) {
    if (finishedRef.current || finished) return;

    if (!started && value.length > 0) {
      setStarted(true);
    }

    if (value.length > typed.length) {
      const newCharacter = value[typed.length];
      const expectedCharacter = passage[typed.length];

      if (newCharacter !== undefined) {
        playSound(newCharacter === expectedCharacter);
      }
    }

    setTyped(value);

    if (passage.length - value.length < 500) {
      setPassage((previous) => {
        if (previous.length - value.length >= 500) return previous;

        return (
          previous +
          generateText(
            mode === "paragraph" ? 3000 : 1800,
            mode === "paragraph",
            difficulty
          )
        );
      });
    }
  }

  function changeDifficulty(nextDifficulty: Difficulty) {
    setDifficulty(nextDifficulty);
    setTyped("");
    setStarted(false);
    setFinished(false);
    finishedRef.current = false;
    setElapsed(0);
    setResult(null);
    setShowResultDetails(false);

    setPassage(
      mode === "paragraph"
        ? generateText(3000, true, nextDifficulty)
        : generateText(2000, false, nextDifficulty)
    );
  }

  function changeDuration(seconds: number) {
    setDuration(seconds);
    finishedRef.current = false;
    setTyped("");
    setStarted(false);
    setFinished(false);
    setElapsed(0);
    setResult(null);
    setShowResultDetails(false);
    setPassage(generateText(2000, false, difficulty));
  }

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if (event.ctrlKey && event.key === "Enter") {
        event.preventDefault();
        resetTest();
      }

      if (
        event.ctrlKey &&
        event.shiftKey &&
        event.key.toLowerCase() === "s"
      ) {
        event.preventDefault();
        setSoundOn((previous) => !previous);
      }
    }

    window.addEventListener("keydown", handleShortcut);

    return () => window.removeEventListener("keydown", handleShortcut);
  });

  const panel = dark
    ? "bg-[#11121c] border-white/10"
    : "bg-white border-black/10";

  const muted = dark ? "text-gray-400" : "text-gray-500";

  const softPanel = dark ? "bg-white/[0.04]" : "bg-black/[0.035]";

  const isNewRecord =
    Boolean(result?.newWpmRecord || result?.newAccuracyRecord);

  // --------------------------------------------------
  // ANIMATED RESULT REVEAL SCREEN
  // --------------------------------------------------

  if (finished && result) {
    return (
      <main
        className={`min-h-screen overflow-x-hidden transition-colors duration-300 ${
          dark
            ? "bg-[#080910] text-white"
            : "bg-[#f5f5fa] text-[#171725]"
        }`}
      >
        <style>{`
          @keyframes typex-pop {
            0% {
              opacity: 0;
              transform: translateY(45px) scale(0.82) rotateX(12deg);
            }
            65% {
              opacity: 1;
              transform: translateY(-7px) scale(1.025) rotateX(0);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1) rotateX(0);
            }
          }

          @keyframes typex-glow {
            0%, 100% {
              box-shadow: 0 0 25px rgba(139, 92, 246, 0.12);
            }
            50% {
              box-shadow: 0 0 65px rgba(139, 92, 246, 0.35);
            }
          }

          @keyframes typex-float {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-10px);
            }
          }

          @keyframes typex-reveal {
            0% {
              opacity: 0;
              transform: translateY(30px) scale(0.94);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          .typex-pop {
            animation: typex-pop 750ms cubic-bezier(.16,1,.3,1) both;
          }

          .typex-glow {
            animation: typex-glow 3s ease-in-out infinite;
          }

          .typex-float {
            animation: typex-float 3s ease-in-out infinite;
          }

          .typex-reveal {
            animation: typex-reveal 650ms cubic-bezier(.16,1,.3,1) both;
          }

          @media (prefers-reduced-motion: reduce) {
            .typex-pop,
            .typex-glow,
            .typex-float,
            .typex-reveal {
              animation: none !important;
            }
          }
        `}</style>

        <header className="relative z-10 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-5 py-5 flex items-center justify-between">
            <div className="text-3xl font-black tracking-wider">
              TYPE<span className="text-violet-500">X</span>
            </div>

            <button
              onClick={() => setDark((previous) => !previous)}
              className={`rounded-xl border px-4 py-2 text-sm ${
                dark
                  ? "bg-white/5 border-white/10"
                  : "bg-white border-black/10"
              }`}
            >
              {dark ? "☀ Light" : "☾ Dark"}
            </button>
          </div>
        </header>

        <section className="relative min-h-[calc(100vh-77px)] flex items-center justify-center px-4 py-12">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute w-80 h-80 rounded-full bg-violet-600/15 blur-[110px] top-10 left-[-100px]" />
            <div className="absolute w-96 h-96 rounded-full bg-indigo-600/10 blur-[120px] bottom-0 right-[-100px]" />
            <div className="absolute w-64 h-64 rounded-full bg-fuchsia-600/10 blur-[100px] top-1/3 left-1/2" />
          </div>

          <div className="relative z-10 w-full max-w-5xl mx-auto">
            {!showResultDetails ? (
              <div className="max-w-2xl mx-auto text-center typex-pop">
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-5 py-2 text-xs font-black tracking-[0.2em] text-violet-400 mb-8">
                  <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                  TYPING SESSION COMPLETED
                </div>

                <div className="typex-float text-7xl sm:text-8xl mb-7">
                  🎉
                </div>

                <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-5">
                  Time&apos;s Up!
                </h1>

                <p
                  className={`text-base sm:text-lg max-w-lg mx-auto mb-10 ${muted}`}
                >
                  You have completed your typing challenge. Your performance
                  is ready to be revealed.
                </p>

                <button
                  onClick={() => setShowResultDetails(true)}
                  className="group relative w-full max-w-md mx-auto block text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/40 rounded-[2rem]"
                >
                  <div className="absolute -inset-1 rounded-[2.1rem] bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-500 opacity-60 blur-lg transition duration-500 group-hover:opacity-100" />

                  <div className="typex-glow relative overflow-hidden rounded-[2rem] border border-violet-300/30 bg-gradient-to-br from-[#21163d] via-[#17132c] to-[#101326] p-7 sm:p-10 transition duration-500 group-hover:-translate-y-2">
                    <div className="absolute -right-12 -top-16 w-48 h-48 rounded-full border border-white/10" />
                    <div className="absolute -right-5 -top-9 w-32 h-32 rounded-full border border-white/10" />

                    <div className="relative flex items-center justify-between gap-4">
                      <div>
                        <div className="text-xs font-black tracking-[0.25em] text-violet-300 mb-3">
                          YOUR REWARD IS READY
                        </div>

                        <div className="text-3xl sm:text-4xl font-black text-white mb-3">
                          Congratulations!
                        </div>

                        <div className="text-sm text-violet-200/80">
                          Tap to reveal your typing result
                        </div>
                      </div>

                      <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/10 border border-white/15 flex items-center justify-center text-5xl shadow-2xl">
                        🏆
                      </div>
                    </div>

                    <div className="relative mt-8 flex items-center justify-between border-t border-white/10 pt-5">
                      <span className="text-xs font-bold tracking-widest text-violet-200">
                        CLICK TO OPEN
                      </span>

                      <span className="flex items-center justify-center w-10 h-10 rounded-full bg-violet-500 text-white text-xl transition group-hover:translate-x-2">
                        →
                      </span>
                    </div>
                  </div>
                </button>

                <p className={`text-xs mt-7 ${muted}`}>
                  Your typing has been stopped and your result has been saved.
                </p>
              </div>
            ) : (
              <div className="typex-reveal">
                <div className="text-center mb-9">
                  <div className="text-violet-400 text-xs font-black tracking-[0.3em] mb-3">
                    TYPEX PERFORMANCE REPORT
                  </div>

                  <h1 className="text-4xl sm:text-5xl font-black mb-3">
                    Your Results
                  </h1>

                  <p className={muted}>
                    Here is how you performed in your typing challenge.
                  </p>
                </div>

                <div
                  className={`grid gap-5 items-stretch ${
                    isNewRecord ? "md:grid-cols-2" : "grid-cols-1"
                  }`}
                >
                  {/* MAIN RESULT CARD */}

                  <div
                    className={`rounded-[2rem] border p-5 sm:p-7 ${
                      dark
                        ? "bg-[#11121c] border-violet-500/30"
                        : "bg-white border-violet-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-7">
                      <div>
                        <div className="text-xs font-black tracking-[0.2em] text-violet-400 mb-2">
                          TEST SUMMARY
                        </div>
                        <h2 className="text-2xl font-black">
                          Typing Result
                        </h2>
                      </div>

                      <div className="w-14 h-14 rounded-2xl bg-violet-500/15 flex items-center justify-center text-3xl">
                        📊
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {[
                        {
                          label: "WPM",
                          value: result.wpm,
                          icon: "⚡",
                          color: "text-violet-400",
                        },
                        {
                          label: "ACCURACY",
                          value: `${result.accuracy}%`,
                          icon: "🎯",
                          color: "text-emerald-500",
                        },
                        {
                          label: "CPM",
                          value: result.cpm,
                          icon: "⌨️",
                          color: "text-sky-400",
                        },
                        {
                          label: "DURATION",
                          value: formatTime(result.duration),
                          icon: "⏱️",
                          color: "text-amber-500",
                        },
                        {
                          label: "CORRECT WORDS",
                          value: result.correctWords,
                          icon: "✅",
                          color: "text-emerald-500",
                        },
                        {
                          label: "WRONG WORDS",
                          value: result.wrongWords,
                          icon: "❌",
                          color: "text-red-400",
                        },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className={`rounded-2xl p-4 ${
                            dark ? "bg-white/[0.045]" : "bg-black/[0.035]"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xl">{stat.icon}</span>
                            <span
                              className={`text-[10px] font-black tracking-wider ${muted}`}
                            >
                              {stat.label}
                            </span>
                          </div>

                          <div
                            className={`text-2xl sm:text-3xl font-black ${stat.color}`}
                          >
                            {stat.value}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div
                      className={`rounded-2xl p-4 mt-4 ${
                        dark ? "bg-white/[0.045]" : "bg-black/[0.035]"
                      }`}
                    >
                      <div className="flex justify-between gap-3 text-sm mb-3">
                        <span className={muted}>Personal Best WPM</span>
                        <strong>{personalBest.wpm}</strong>
                      </div>

                      <div className="flex justify-between gap-3 text-sm">
                        <span className={muted}>Best Accuracy</span>
                        <strong>{personalBest.accuracy}%</strong>
                      </div>
                    </div>

                    <div
                      className={`mt-4 text-xs text-center ${muted}`}
                    >
                      {result.date} · {result.mode} mode · {result.difficulty}
                    </div>
                  </div>

                  {/* TROPHY CARD - ONLY WHEN A RECORD IS BEATEN */}

                  {isNewRecord && (
                    <div className="relative overflow-hidden rounded-[2rem] border border-amber-400/40 bg-gradient-to-br from-[#392814] via-[#251b18] to-[#171329] p-6 sm:p-8 flex flex-col items-center justify-center text-center typex-reveal">
                      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-amber-400/10 blur-3xl" />
                      <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-orange-500/10 blur-3xl" />

                      <div className="relative">
                        <div className="typex-float text-7xl sm:text-8xl mb-6">
                          🏆
                        </div>

                        <div className="inline-flex rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-xs font-black tracking-[0.2em] text-amber-300 mb-5">
                          NEW PERSONAL RECORD
                        </div>

                        <h2 className="text-3xl sm:text-4xl font-black text-amber-300 mb-4">
                          Incredible!
                        </h2>

                        <p className="text-amber-100/70 text-sm leading-6 max-w-sm mx-auto mb-7">
                          You just achieved a new personal milestone. Keep
                          practicing and keep breaking your limits!
                        </p>

                        <div className="space-y-4 w-full">
                          {result.newWpmRecord && (
                            <div className="rounded-2xl border border-amber-400/20 bg-black/20 p-4">
                              <div className="text-3xl font-black text-amber-300">
                                {result.wpm} WPM
                              </div>
                              <div className="text-xs text-amber-100/60 mt-1">
                                NEW HIGHEST SPEED
                              </div>
                            </div>
                          )}

                          {result.newAccuracyRecord && (
                            <div className="rounded-2xl border border-amber-400/20 bg-black/20 p-4">
                              <div className="text-3xl font-black text-amber-300">
                                {result.accuracy}%
                              </div>
                              <div className="text-xs text-amber-100/60 mt-1">
                                NEW BEST ACCURACY
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="mt-7 text-xs font-bold tracking-widest text-amber-300/70">
                          YOU DID IT!
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap justify-center gap-3 mt-9">
                  <button
                    onClick={() => resetTest()}
                    className="rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold px-8 py-4 transition hover:-translate-y-1"
                  >
                    ↻ Try Again
                  </button>

                  <button
                    onClick={() => setShowHistory(true)}
                    className={`rounded-xl border px-7 py-4 font-bold transition ${
                      dark
                        ? "border-white/10 bg-white/5 hover:bg-white/10"
                        : "border-black/10 bg-white hover:bg-gray-50"
                    }`}
                  >
                    📊 View History
                  </button>
                </div>

                {showHistory && (
                  <div
                    className={`rounded-3xl border p-5 mt-8 ${
                      dark
                        ? "bg-[#11121c] border-white/10"
                        : "bg-white border-black/10"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-5">
                      <h2 className="text-xl font-black">
                        Your Test History
                      </h2>

                      <button
                        onClick={() => setShowHistory(false)}
                        className={`rounded-lg px-3 py-2 border ${
                          dark
                            ? "border-white/10 bg-white/5"
                            : "border-black/10"
                        }`}
                      >
                        Close
                      </button>
                    </div>

                    {!storageReady ? (
                      <p className={muted}>Loading your history...</p>
                    ) : history.length === 0 ? (
                      <p className={muted}>No tests completed yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {history.map((item) => (
                          <div
                            key={item.id}
                            className={`rounded-xl p-4 flex flex-wrap justify-between gap-3 ${
                              dark ? "bg-white/[0.04]" : "bg-black/[0.035]"
                            }`}
                          >
                            <div>
                              <p className="font-bold">
                                {item.wpm} WPM · {item.accuracy}% Accuracy
                              </p>
                              <p className={`text-xs mt-1 ${muted}`}>
                                {item.date} · {item.difficulty} · {item.mode}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="font-semibold">
                                {formatTime(item.duration)}
                              </p>

                              {item.newWpmRecord ||
                              item.newAccuracyRecord ? (
                                <span className="text-xs text-amber-500 font-bold">
                                  🏆 New Record
                                </span>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="text-center mt-12">
              <div className="text-2xl font-black tracking-widest">
                TYPE<span className="text-violet-500">X</span>
              </div>

              <p className={`text-xs mt-2 ${muted}`}>
                Practice today. Type better tomorrow.
              </p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  // --------------------------------------------------
  // NORMAL TYPING TEST SCREEN
  // --------------------------------------------------

  return (
    <main
      className={`min-h-screen transition-colors duration-300 ${
        dark
          ? "bg-[#090a10] text-white"
          : "bg-[#f5f5fa] text-[#171725]"
      }`}
    >
      <header
        className={`border-b ${
          dark ? "border-white/10" : "border-black/10"
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 py-5 flex items-center justify-between gap-4">
          <button
            onClick={() => resetTest("time")}
            className="text-3xl font-black tracking-wider"
          >
            TYPE<span className="text-violet-500">X</span>
          </button>

          <nav className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowHistory((previous) => !previous)}
              className={`rounded-xl border px-3 py-2 text-sm ${panel}`}
            >
              <span className="hidden sm:inline">📊 </span>
              History
            </button>

            <button
              onClick={() => setDark((previous) => !previous)}
              className={`rounded-xl border px-3 py-2 text-sm ${panel}`}
            >
              {dark ? "☀ Light" : "☾ Dark"}
            </button>
          </nav>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 sm:px-5 pt-10 sm:pt-12 pb-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-semibold text-violet-400 mb-5">
            <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
            YOUR PERSONAL TYPING ARENA
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">
            Master Your <span className="text-violet-500">Typing.</span>
          </h1>

          <p className={`max-w-xl mx-auto ${muted}`}>
            Practice every day, improve your speed, and become a more accurate
            typist with TYPEX.
          </p>
        </div>

        {showHistory && (
          <div className={`rounded-3xl border p-5 sm:p-7 mb-7 ${panel}`}>
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-xl font-black">Your Test History</h2>
                <p className={`text-sm mt-1 ${muted}`}>
                  Your latest results saved on this browser.
                </p>
              </div>

              <button
                onClick={() => setShowHistory(false)}
                className={`rounded-lg px-3 py-2 border ${panel}`}
              >
                Close
              </button>
            </div>

            {!storageReady ? (
              <p className={muted}>Loading your history...</p>
            ) : history.length === 0 ? (
              <div className={`rounded-2xl p-6 text-center ${softPanel}`}>
                <div className="text-3xl mb-2">⌨️</div>
                <p className="font-bold">No tests completed yet</p>
                <p className={`text-sm mt-1 ${muted}`}>
                  Complete your first test to see your history here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-xl p-4 ${softPanel} flex flex-wrap items-center justify-between gap-3`}
                  >
                    <div>
                      <p className="font-bold">
                        {item.wpm} WPM · {item.accuracy}% Accuracy
                      </p>
                      <p className={`text-xs mt-1 ${muted}`}>
                        {item.date} · {item.difficulty} · {item.mode}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold">
                        {formatTime(item.duration)}
                      </p>

                      {(item.newWpmRecord || item.newAccuracyRecord) && (
                        <span className="text-xs text-amber-500 font-bold">
                          🏆 New Record
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3 mb-7">
          {[
            { id: "time", label: "Time Mode", detail: "Beat the clock" },
            { id: "infinite", label: "Infinite Mode", detail: "Type forever" },
            {
              id: "paragraph",
              label: "Paragraph Mode",
              detail: "Long paragraphs",
            },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => resetTest(item.id as Mode)}
              className={`rounded-2xl border px-5 py-3 text-left transition ${
                mode === item.id
                  ? "border-violet-500 bg-violet-500/15"
                  : `${panel} hover:border-violet-500/50`
              }`}
            >
              <div className="font-bold">{item.label}</div>
              <div className={`text-xs mt-1 ${muted}`}>{item.detail}</div>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
          <span className={`text-xs font-bold tracking-wider mr-1 ${muted}`}>
            DIFFICULTY
          </span>

          {(["easy", "medium", "hard"] as Difficulty[]).map((level) => (
            <button
              key={level}
              onClick={() => changeDifficulty(level)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold border capitalize transition ${
                difficulty === level
                  ? "bg-violet-600 border-violet-600 text-white"
                  : `${panel} ${muted}`
              }`}
            >
              {level}
            </button>
          ))}
        </div>

        {mode === "time" && (
          <div className="flex flex-wrap justify-center gap-2 mb-7">
            {[15, 30, 60, 120].map((seconds) => (
              <button
                key={seconds}
                onClick={() => changeDuration(seconds)}
                className={`rounded-xl px-5 py-2 text-sm font-semibold border ${
                  duration === seconds
                    ? "bg-violet-600 border-violet-600 text-white"
                    : `${panel} ${muted}`
                }`}
              >
                {seconds}s
              </button>
            ))}
          </div>
        )}

        <div className={`rounded-3xl border p-4 sm:p-8 ${panel}`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-7">
            {[
              { label: "WPM", value: wpm },
              { label: "CPM", value: cpm },
              { label: "ACCURACY", value: `${accuracy}%` },
              {
                label: mode === "time" ? "TIME LEFT" : "TIME ELAPSED",
                value:
                  mode === "time"
                    ? formatTime(timeLeft)
                    : formatTime(elapsed),
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`rounded-2xl p-4 text-center ${softPanel}`}
              >
                <div className={`text-xs tracking-widest mb-2 ${muted}`}>
                  {stat.label}
                </div>

                <div className="text-2xl sm:text-3xl font-black text-violet-500 tabular-nums">
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mb-2">
            <span className={`text-xs font-semibold ${muted}`}>
              {mode === "time" ? "TIME PROGRESS" : "PASSAGE PROGRESS"}
            </span>

            <span className={`text-xs font-bold ${muted}`}>
              {Math.round(progress)}%
            </span>
          </div>

          <div
            className={`h-2 rounded-full mb-6 overflow-hidden ${
              dark ? "bg-white/10" : "bg-black/10"
            }`}
          >
            <div
              className="h-full bg-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className={`text-sm ${muted}`}>
              {mode === "time" && "Timed typing challenge"}
              {mode === "infinite" && "∞ Unlimited typing"}
              {mode === "paragraph" && "Long paragraph practice"}
              <span className="capitalize"> · {difficulty}</span>
            </div>

            <button
              onClick={() => setSoundOn((previous) => !previous)}
              className={`text-sm rounded-lg px-3 py-2 border ${panel}`}
            >
              {soundOn ? "🔊 Sound ON" : "🔇 Sound OFF"}
            </button>
          </div>

          <div
            onClick={() => inputRef.current?.focus()}
            className={`min-h-[220px] max-h-[340px] overflow-y-auto rounded-2xl border p-5 sm:p-6 text-base sm:text-lg leading-9 tracking-wide cursor-text ${
              dark
                ? "bg-[#090a10] border-white/10"
                : "bg-[#f8f8fc] border-black/10"
            }`}
          >
            <div className="whitespace-pre-wrap break-words">
              {passage.split("").map((character, index) => {
                let color = dark ? "text-gray-500" : "text-gray-400";

                if (index < typed.length) {
                  color =
                    typed[index] === character
                      ? "text-emerald-500"
                      : "text-red-500 underline decoration-red-500";
                }

                const isCursor = index === typed.length && !finished;

                return (
                  <span
                    key={index}
                    className={`${color} ${
                      isCursor
                        ? "border-l-2 border-violet-500 animate-pulse"
                        : ""
                    }`}
                  >
                    {character}
                  </span>
                );
              })}
            </div>
          </div>

          <textarea
            ref={inputRef}
            value={typed}
            onChange={(event) => handleTyping(event.target.value)}
            onKeyDown={(event) => {
              if (event.ctrlKey && event.key === "Enter") {
                event.preventDefault();
                resetTest();
              }
            }}
            disabled={finished}
            placeholder="Click here and start typing..."
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            className={`mt-5 w-full h-28 resize-none rounded-2xl border p-5 outline-none transition focus:border-violet-500 ${
              dark
                ? "bg-[#090a10] border-white/10 text-white placeholder:text-gray-600"
                : "bg-[#f8f8fc] border-black/10 text-black placeholder:text-gray-400"
            }`}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 mt-5">
            <div className={`text-sm ${muted}`}>
              Correct:{" "}
              <span className="text-emerald-500 font-bold">
                {correctCount}
              </span>

              <span className="mx-2">•</span>

              Wrong:{" "}
              <span className="text-red-500 font-bold">{wrongCount}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {mode !== "time" && started && (
                <button
                  onClick={() => finishTest()}
                  className="rounded-xl border border-violet-500/40 px-5 py-3 font-bold text-violet-500"
                >
                  Finish Test
                </button>
              )}

              <button
                onClick={() => resetTest()}
                className="rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold px-6 py-3 transition"
              >
                ↻ Restart Test
              </button>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mt-7">
          {[
            {
              title: "Time Mode",
              description:
                "Choose a time limit and challenge yourself to type as accurately and quickly as possible.",
            },
            {
              title: "Infinite Mode",
              description:
                "No countdown and no fixed passage. Fresh English text keeps appearing as you type.",
            },
            {
              title: "Paragraph Mode",
              description:
                "Practice with long paragraphs and improve your reading flow and typing consistency.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className={`rounded-2xl border p-5 ${panel}`}
            >
              <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
              <p className={`text-sm leading-6 ${muted}`}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className={`rounded-3xl border p-5 sm:p-7 mt-7 ${panel}`}>
          <h3 className="text-lg font-black mb-4">Your Personal Best</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className={`rounded-2xl p-4 ${softPanel}`}>
              <p className={`text-xs mb-2 ${muted}`}>HIGHEST WPM</p>
              <p className="text-3xl font-black text-violet-500">
                {personalBest.wpm}
              </p>
            </div>

            <div className={`rounded-2xl p-4 ${softPanel}`}>
              <p className={`text-xs mb-2 ${muted}`}>BEST ACCURACY</p>
              <p className="text-3xl font-black text-violet-500">
                {personalBest.accuracy}%
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-16">
          <div className="text-3xl font-black tracking-widest">
            TYPE<span className="text-violet-500">X</span>
          </div>

          <p className={`text-sm mt-2 ${muted}`}>
            Practice today. Type better tomorrow.
          </p>

          <p className={`text-xs mt-5 ${muted}`}>
            ©  TYPEX. All rights reserved.
          </p>

          <p className="text-sm font-semibold text-violet-400 mt-3">
            Developed by Sahariya Ahmed Musa
          </p>

          <p className={`text-xs mt-4 ${muted}`}>
            Shortcuts: Ctrl + Enter = Restart · Ctrl + Shift + S = Sound ON/OFF
          </p>
        </div>
      </section>
    </main>
  );
}