"use client";

import { useEffect } from "react";

type PeriodicSyncRegistration = {
  register: (tag: string, options: { minInterval: number }) => Promise<void>;
  getTags: () => Promise<string[]>;
};

type RegistrationWithPeriodicSync = ServiceWorkerRegistration & {
  periodicSync?: PeriodicSyncRegistration;
};

const REMINDER_TAG = "homework-reminders";
const REMINDER_INTERVAL = 12 * 60 * 60 * 1000;

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let cancelled = false;

    async function register() {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        const registration = await navigator.serviceWorker.ready;
        if (cancelled) return;
        const periodic = (registration as RegistrationWithPeriodicSync).periodicSync;
        if (!periodic) return;
        try {
          const tags = await periodic.getTags();
          if (!tags.includes(REMINDER_TAG)) {
            await periodic.register(REMINDER_TAG, { minInterval: REMINDER_INTERVAL });
          }
        } catch {
          return;
        }
      } catch {
        return;
      }
    }

    void register();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}