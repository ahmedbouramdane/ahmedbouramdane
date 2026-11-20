"use client";

import { Eye, EyeOff, GraduationCap, LockKeyhole, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { StudyApiError, studyMutate, type StudyUser } from "../lib/api";
import { Alert, Button, Field, Input } from "./ui";

export function LoginScreen({ onSignedIn }: { onSignedIn: (user: StudyUser) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    if (!username.trim() || !password) {
      setError("Enter your username and password.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await studyMutate<{ user: StudyUser }>("/login", "POST", {
        username: username.trim(),
        password,
      });
      onSignedIn(result.user);
    } catch (caught) {
      setError(
        caught instanceof StudyApiError
          ? caught.detail
          : "Sign in failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-900 antialiased">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
            <GraduationCap className="size-7" aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-[var(--font-display)] text-2xl font-semibold tracking-tight">
              BAC SM Organizer
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Private study space for 2 Bac Sciences Mathématiques
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-7 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          {error ? <Alert>{error}</Alert> : null}

          <Field label="Username" htmlFor="study-username">
            <div className="relative">
              <UserRound
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <Input
                id="study-username"
                name="username"
                autoComplete="username"
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="pl-9"
                placeholder="ahmedbouramdane"
              />
            </div>
          </Field>

          <Field label="Password" htmlFor="study-password">
            <div className="relative">
              <LockKeyhole
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <Input
                id="study-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="pl-9 pr-11"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
              >
                {showPassword ? (
                  <EyeOff className="size-4" aria-hidden="true" />
                ) : (
                  <Eye className="size-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </Field>

          <Button type="submit" loading={submitting} className="w-full">
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-center text-[11px] text-slate-400">
            This space is private and is not linked from the portfolio.
          </p>
        </form>
      </div>
    </main>
  );
}