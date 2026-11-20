"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  StudyApiError,
  studyGet,
  studyMutate,
  type QuestionPriority,
  type QuestionStatus,
  type StudyUser,
} from "./lib/api";
import { AppShell, type StudyTab } from "./components/app-shell";
import { LoginScreen } from "./components/login-screen";
import { Button, Card, EmptyState, Skeleton } from "./components/ui";
import { clearCachedStudyData, refreshCachedStudyData } from "./lib/notifications";
import { DashboardTab } from "./tabs/dashboard-tab";
import { HomeworksTab } from "./tabs/homeworks-tab";
import { LessonsTab } from "./tabs/lessons-tab";
import { QuestionsTab } from "./tabs/questions-tab";

const studyTabs: StudyTab[] = ["dashboard", "lessons", "questions", "homeworks"];

function readTabFromLocation(): StudyTab {
  if (typeof window === "undefined") return "dashboard";
  const value = new URLSearchParams(window.location.search).get("tab");
  return studyTabs.includes(value as StudyTab) ? (value as StudyTab) : "dashboard";
}

function useTabState() {
  const [tab, setTab] = useState<StudyTab>(() => readTabFromLocation());

  useEffect(() => {
    const handlePopState = () => setTab(readTabFromLocation());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const changeTab = useCallback((next: StudyTab) => {
    setTab(next);
    const url = new URL(window.location.href);
    if (next === "dashboard") url.searchParams.delete("tab");
    else url.searchParams.set("tab", next);
    window.history.replaceState(null, "", url);
  }, []);

  return { tab, changeTab };
}

type AuthState = "checking" | "anonymous" | "ready" | "error";

type StudyFilters = {
  subjectId?: number;
  questionStatus?: QuestionStatus;
  priority?: QuestionPriority;
};

export default function StudentManagementClient() {
  const { tab, changeTab } = useTabState();
  const [filters, setFilters] = useState<StudyFilters>({});

  const [authState, setAuthState] = useState<AuthState>("checking");
  const [user, setUser] = useState<StudyUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [checkKey, setCheckKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    studyGet<{ user: StudyUser }>("/session")
      .then((result) => {
        if (cancelled) return;
        setUser(result.user);
        setAuthState("ready");
        if (
          typeof navigator !== "undefined" &&
          "serviceWorker" in navigator &&
          !navigator.serviceWorker.controller
        ) {
          refreshCachedStudyData();
        }
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        if (caught instanceof StudyApiError && caught.status === 401) {
          setUser(null);
          setAuthState("anonymous");
          return;
        }
        setAuthError(
          caught instanceof StudyApiError
            ? caught.detail
            : "The study service could not be reached.",
        );
        setAuthState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [checkKey]);

  const navigate = useCallback(
    (next: StudyTab, options?: StudyFilters) => {
      setFilters(options ?? {});
      changeTab(next);
    },
    [changeTab],
  );

  const handleTabChange = useCallback(
    (next: StudyTab) => {
      setFilters({});
      changeTab(next);
    },
    [changeTab],
  );

  const handleSignOut = useCallback(async () => {
    try {
      await studyMutate("/logout", "POST");
    } catch {
      // Even if the request fails, drop the local session.
    }
    clearCachedStudyData();
    setUser(null);
    setAuthState("anonymous");
    setFilters({});
    changeTab("dashboard");
    toast.success("Signed out");
  }, [changeTab]);

  function retryAuth() {
    setAuthState("checking");
    setAuthError(null);
    setCheckKey((key) => key + 1);
  }

  if (authState === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm space-y-3" aria-busy="true" aria-label="Checking your session">
          <Skeleton className="mx-auto size-14 rounded-2xl" />
          <Skeleton className="h-6 w-48 mx-auto" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </main>
    );
  }

  if (authState === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <Card className="w-full max-w-sm">
          <EmptyState
            icon={<AlertTriangle className="size-5" />}
            title="The study space is unavailable"
            description={authError ?? undefined}
            action={
              <Button variant="secondary" onClick={retryAuth}>
                <RefreshCw className="size-4" aria-hidden="true" />
                Try again
              </Button>
            }
          />
        </Card>
      </main>
    );
  }

  if (authState === "anonymous" || !user) {
    return (
      <LoginScreen
        onSignedIn={(signedIn) => {
          setUser(signedIn);
          setAuthState("ready");
          setFilters({});
          changeTab("dashboard");
        }}
      />
    );
  }

  return (
    <AppShell
      user={user}
      activeTab={tab}
      onTabChange={handleTabChange}
      onSignOut={() => void handleSignOut()}
    >
      {tab === "dashboard" ? <DashboardTab onNavigate={navigate} /> : null}
      {tab === "lessons" ? <LessonsTab initialSubjectId={filters.subjectId} /> : null}
      {tab === "questions" ? (
        <QuestionsTab
          initialStatus={filters.questionStatus}
          initialPriority={filters.priority}
        />
      ) : null}
      {tab === "homeworks" ? <HomeworksTab /> : null}
    </AppShell>
  );
}