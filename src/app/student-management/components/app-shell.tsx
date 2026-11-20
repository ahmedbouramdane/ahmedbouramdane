"use client";

import {
  BookOpen,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  MessageCircleQuestion,
  NotebookPen,
  WifiOff,
} from "lucide-react";
import { useState, type ComponentType, KeyboardEvent, ReactNode } from "react";
import type { StudyUser } from "../lib/api";
import { useOnline } from "../lib/use-online";
import { ProfileDialog } from "./profile-dialog";

export type StudyTab = "dashboard" | "lessons" | "questions" | "homeworks";

type TabDefinition = {
  id: StudyTab;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const tabs: TabDefinition[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "lessons", label: "Lessons", icon: BookOpen },
  { id: "questions", label: "Questions", icon: MessageCircleQuestion },
  { id: "homeworks", label: "Homeworks", icon: NotebookPen },
];

function ProfileButton({
  user,
  onClick,
  compact = false,
}: {
  user: StudyUser;
  onClick: () => void;
  compact?: boolean;
}) {
  const initials = user.username.slice(0, 2).toUpperCase();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open profile and settings"
      className={`flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
        compact ? "px-2 py-1.5" : "w-full px-2.5 py-2 text-left"
      }`}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-indigo-50 text-[11px] font-semibold text-indigo-700">
        {initials}
      </span>
      <span className={compact ? "hidden min-w-0 sm:block" : "min-w-0 flex-1"}>
        <span className="block truncate text-xs font-semibold text-slate-800">
          {user.username}
        </span>
        {compact ? null : (
          <span className="block text-[11px] text-slate-500">Profile &amp; settings</span>
        )}
      </span>
      <ChevronRight className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
    </button>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white shadow-sm">
        <GraduationCap className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-[var(--font-display)] text-sm font-semibold tracking-tight text-slate-900">
          BAC SM Organizer
        </span>
        <span className="block text-[11px] text-slate-500">Private study space</span>
      </span>
    </div>
  );
}

export function AppShell({
  user,
  activeTab,
  onTabChange,
  onSignOut,
  children,
}: {
  user: StudyUser;
  activeTab: StudyTab;
  onTabChange: (tab: StudyTab) => void;
  onSignOut: () => void;
  children: ReactNode;
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const online = useOnline();
  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === activeTab),
  );

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    const keys = ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft", "Home", "End"];
    if (!keys.includes(event.key)) return;
    let nextIndex = activeIndex;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      nextIndex = (activeIndex + 1) % tabs.length;
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      nextIndex = (activeIndex - 1 + tabs.length) % tabs.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = tabs.length - 1;
    }
    event.preventDefault();
    const nextTab = tabs[nextIndex];
    onTabChange(nextTab.id);
    const prefix = event.currentTarget.dataset.tabPrefix ?? "study-tab";
    event.currentTarget
      .querySelector<HTMLButtonElement>(`#${prefix}-${nextTab.id}`)
      ?.focus();
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white px-4 py-5 lg:flex">
        <Brand />
        <nav className="relative mt-7">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-1 -top-0.5 h-12 rounded-xl bg-indigo-50 transition-transform duration-300 ease-out motion-reduce:transition-none"
            style={{ transform: `translateY(${activeIndex * 48}px)` }}
          />
          <div
            role="tablist"
            aria-label="Study sections"
            aria-orientation="vertical"
            data-tab-prefix="study-tab"
            onKeyDown={handleKeyDown}
            className="space-y-1"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  id={`study-tab-${tab.id}`}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls="study-tabpanel"
                  tabIndex={active ? 0 : -1}
                  onClick={() => onTabChange(tab.id)}
                  className={`relative flex h-11 w-full items-center gap-2.5 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
                    active
                      ? "text-indigo-700"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Icon className="size-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="mt-auto space-y-3 pt-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5">
            <p className="font-[var(--font-mono)] text-[10px] uppercase tracking-[0.14em] text-slate-500">
              Curriculum
            </p>
            <p className="mt-1 text-xs font-medium text-slate-700">3 subjects · 41 lessons</p>
            <p className="text-[11px] text-slate-500">217 subtitles to track</p>
          </div>
          {!online ? (
            <p className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-medium text-amber-700">
              <WifiOff className="size-3.5" aria-hidden="true" />
              Offline
            </p>
          ) : null}
          <ProfileButton user={user} onClick={() => setProfileOpen(true)} />
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <Brand />
        <div className="flex items-center gap-2">
          {!online ? (
            <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-700">
              <WifiOff className="size-3" aria-hidden="true" />
              Offline
            </span>
          ) : null}
          <ProfileButton user={user} compact onClick={() => setProfileOpen(true)} />
        </div>
      </header>

      <div className="lg:pl-64">
        <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-12">
          <div
            id="study-tabpanel"
            role="tabpanel"
            aria-labelledby={`study-tab-${activeTab}`}
            tabIndex={0}
            className="focus-visible:outline-none"
          >
            {children}
          </div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="relative">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-1 left-0 w-1/4 transition-transform duration-300 ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(${activeIndex * 100}%)` }}
          >
            <span className="mx-1 block h-full rounded-xl bg-indigo-50" />
          </span>
          <div
            role="tablist"
            aria-label="Study sections"
            aria-orientation="horizontal"
            data-tab-prefix="study-tab-mobile"
            onKeyDown={handleKeyDown}
            className="grid grid-cols-4"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  id={`study-tab-mobile-${tab.id}`}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls="study-tabpanel"
                  tabIndex={active ? 0 : -1}
                  onClick={() => onTabChange(tab.id)}
                  className={`relative flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 ${
                    active ? "text-indigo-600" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Icon className="size-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <ProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        user={user}
        onSignOut={onSignOut}
      />
    </div>
  );
}