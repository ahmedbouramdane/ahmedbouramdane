import type { Homework } from "./api";
import { daysUntil } from "./format";

export type HomeworkNotificationInput = {
  id: number;
  title: string;
  subject_name: string;
  due_on: string | null;
  status: string;
};

export function notificationsSupported() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator
  );
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  if (!notificationsSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<
  NotificationPermission | "unsupported"
> {
  if (!notificationsSupported()) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

async function postToServiceWorker(message: unknown) {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message);
    return;
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    registration.active?.postMessage(message);
  } catch {
    return;
  }
}

export function sendHomeworkNotifications(homeworks: HomeworkNotificationInput[]) {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  const due = homeworks
    .filter((homework) => {
      if (homework.status === "submitted" || homework.status === "graded") return false;
      const days = daysUntil(homework.due_on);
      return days !== null && days <= 0;
    })
    .map((homework) => ({
      id: homework.id,
      title: homework.title,
      subject_name: homework.subject_name,
      due_on: homework.due_on,
    }));
  if (due.length === 0) return;
  void postToServiceWorker({ type: "SHOW_HOMEWORK_NOTIFICATIONS", homeworks: due });
}

export function clearCachedStudyData() {
  void postToServiceWorker({ type: "CLEAR_STUDY_CACHE" });
}

export function refreshCachedHomeworks() {
  void postToServiceWorker({ type: "REFRESH_HOMEWORKS" });
}

export function refreshCachedStudyData() {
  void postToServiceWorker({ type: "REFRESH_STUDY_CACHE" });
}

export function homeworkNotificationItems(homeworks: Homework[]): HomeworkNotificationInput[] {
  return homeworks.map((homework) => ({
    id: homework.id,
    title: homework.title,
    subject_name: homework.subject_name,
    due_on: homework.due_on,
    status: homework.status,
  }));
}