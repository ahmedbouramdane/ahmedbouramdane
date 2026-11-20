"use client";

import { KeyRound, Lock, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { StudyApiError, studyMutate, type StudyUser } from "../lib/api";
import { Alert, Button, Field, Input, StudyDialog } from "./ui";

export function ProfileDialog({
  open,
  onOpenChange,
  user,
  onSignOut,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: StudyUser;
  onSignOut: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handlePasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setError(null);

    if (!currentPassword) {
      setError("Enter your current password.");
      return;
    }
    if (newPassword.length < 8) {
      setError("The new password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      await studyMutate("/password", "POST", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success("Password updated. Other sessions were signed out.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (caught) {
      setError(
        caught instanceof StudyApiError
          ? caught.detail
          : "The password could not be updated.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await onSignOut();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <StudyDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Profile"
      description="Account, password, and privacy."
      wide
    >
      <div className="space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
              <UserRound className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{user.username}</p>
              <p className="text-[11px] text-slate-500">Private study account</p>
            </div>
          </div>
          <div className="mt-3">
            <Field
              label="Username"
              htmlFor="profile-username"
              hint="Your username cannot be changed."
            >
              <Input id="profile-username" value={user.username} readOnly disabled />
            </Field>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <KeyRound className="size-3.5 text-slate-500" aria-hidden="true" />
            Change password
          </p>
          {error ? <Alert className="mt-2">{error}</Alert> : null}
          <form onSubmit={handlePasswordChange} className="mt-3 space-y-3">
            <Field label="Current password" htmlFor="profile-current-password">
              <Input
                id="profile-current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="New password"
                htmlFor="profile-new-password"
                hint="At least 8 characters."
              >
                <Input
                  id="profile-new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </Field>
              <Field label="Confirm new password" htmlFor="profile-confirm-password">
                <Input
                  id="profile-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </Field>
            </div>
            <Button type="submit" loading={saving}>
              Update password
            </Button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-800">Session</p>
              <p className="text-[11px] text-slate-500">
                Signed in on this browser. Changing your password signs out other devices.
              </p>
            </div>
            <Button
              variant="secondary"
              loading={signingOut}
              onClick={() => void handleSignOut()}
            >
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Lock className="size-3.5 text-slate-500" aria-hidden="true" />
            Curriculum
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Subjects", value: "3" },
              { label: "Lessons", value: "41" },
              { label: "Subtitles", value: "217" },
              { label: "Seed version", value: "1" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5"
              >
                <p className="font-[var(--font-mono)] text-[10px] uppercase tracking-[0.12em] text-slate-500">
                  {item.label}
                </p>
                <p className="mt-1 font-[var(--font-display)] text-lg font-semibold text-slate-800">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            Mathematics, Physics, and Chemistry are seeded from the official 2 Bac Sciences
            Mathématiques program. Curriculum edits happen in the codebase and are applied on
            the next backend start; your notes and statuses are never overwritten.
          </p>
        </section>

        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            Privacy
          </p>
          <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-emerald-900/80">
            <li>This space is not linked from the portfolio and is not indexed by search engines.</li>
            <li>
              Your data lives in a separate SQLite file (
              <code className="rounded bg-white/70 px-1 py-0.5 font-[var(--font-mono)]">
                backend/data/2bac-study.db
              </code>
              ) and is never shared with portfolio visitors.
            </li>
            <li>Sessions use an HTTP-only cookie that expires after 30 days of inactivity.</li>
          </ul>
        </section>
      </div>
    </StudyDialog>
  );
}