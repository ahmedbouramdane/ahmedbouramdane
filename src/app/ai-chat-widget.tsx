"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowDown,
  ArrowRight,
  AtSign,
  Bot,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  History,
  ImagePlus,
  LoaderCircle,
  LockKeyhole,
  LogIn,
  LogOut,
  Mail,
  MessageCircle,
  MessageSquare,
  MessageSquarePlus,
  Pencil,
  Phone,
  Plus,
  Save,
  Send,
  ShieldCheck,
  Trash2,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import ProjectImage from "./project-image";

type Account = {
  id: number;
  full_name: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  avatar_image: string | null;
};

type Conversation = { id: string; title: string; created_at: string; updated_at: string };
type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  sources: { title: string; url: string }[];
  created_at: string;
};
type DirectMessage = {
  id: number;
  sender_role: "user" | "admin";
  content: string;
  is_read: boolean;
  created_at: string;
};
type AuthMode = "login" | "create";
type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid" | "error";
type ConvPage = { items: Conversation[]; total: number; limit: number; offset: number };
type MsgPage = { thread: { total: number; unread: number; has_more: boolean; messages: DirectMessage[] } };

const CONV_PAGE_SIZE = 20;
const DIRECT_PAGE_SIZE = 30;
const CHAT_PAGE_SIZE = 40;

const ACCENT = "#d75e2e";
const ACCENT_HOVER = "#c24f24";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAccount(value: unknown): value is Account {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.full_name === "string" &&
    typeof value.username === "string" &&
    typeof value.email === "string" &&
    typeof value.phone === "string" &&
    typeof value.role === "string" &&
    (typeof value.avatar_image === "string" || value.avatar_image === null)
  );
}

function isChatMessageArray(value: unknown): value is ChatMessage[] {
  return Array.isArray(value) && value.every(isChatMessage);
}

function isConversation(value: unknown): value is Conversation {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.created_at === "string" &&
    typeof value.updated_at === "string"
  );
}

function isChatMessage(value: unknown): value is ChatMessage {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    (value.role === "user" || value.role === "assistant") &&
    typeof value.content === "string" &&
    Array.isArray(value.sources) &&
    value.sources.every(
      (source) =>
        isRecord(source) &&
        typeof source.title === "string" &&
        typeof source.url === "string" &&
        /^https?:\/\//.test(source.url),
    ) &&
    typeof value.created_at === "string"
  );
}

function isConvPage(value: unknown): value is ConvPage {
  return (
    isRecord(value) &&
    Array.isArray(value.items) &&
    value.items.every(isConversation) &&
    typeof value.total === "number" &&
    typeof value.limit === "number" &&
    typeof value.offset === "number"
  );
}

function isDirectThreadPage(value: unknown): value is MsgPage {
  return (
    isRecord(value) &&
    isRecord(value.thread) &&
    typeof value.thread.total === "number" &&
    typeof value.thread.unread === "number" &&
    typeof value.thread.has_more === "boolean" &&
    Array.isArray(value.thread.messages) &&
    value.thread.messages.every(
      (m) =>
        isRecord(m) &&
        typeof m.id === "number" &&
        (m.sender_role === "user" || m.sender_role === "admin") &&
        typeof m.content === "string" &&
        typeof m.is_read === "boolean" &&
        typeof m.created_at === "string",
    )
  );
}

function errorMessage(payload: unknown, fallback: string) {
  if (!isRecord(payload)) return fallback;
  if (typeof payload.detail === "string") return payload.detail;
  if (Array.isArray(payload.detail)) {
    const messages = payload.detail
      .map((item) => (isRecord(item) && typeof item.msg === "string" ? item.msg : ""))
      .filter(Boolean);
    if (messages.length) return messages.slice(0, 2).join(" ");
  }
  return fallback;
}

async function requestJson(url: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(url, { ...init, cache: "no-store", credentials: "same-origin" });
  let payload: unknown = null;
  if (response.status !== 204) {
    try {
      payload = await response.json();
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
    }
  }
  if (!response.ok) {
    const detail = errorMessage(payload, "The request could not be completed.");
    throw Object.assign(new Error(detail), { status: response.status });
  }
  return payload;
}

function makeUsername(value: string) {
  return value
    .trim()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 32);
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function formatTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function Avatar({
  account,
  size = 38,
}: {
  account: { full_name: string; avatar_image?: string | null };
  size?: number;
}) {
  return (
    <span
      className="grid shrink-0 place-items-center overflow-hidden rounded-full ring-1 ring-[#e2d5c3]"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg, #f5ecdd, #fbf5e9)",
        color: "#a1552a",
      }}
    >
      {account.avatar_image ? (
        <ProjectImage
          src={account.avatar_image}
          alt={`${account.full_name}'s profile`}
          className="size-full object-cover"
          sizes={`${size}px`}
        />
      ) : (
        <UserRound size={Math.round(size * 0.48)} aria-hidden="true" />
      )}
    </span>
  );
}

function AhmedCube({
  size = "md",
  thinking = false,
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  thinking?: boolean;
  className?: string;
}) {
  const sizeClass =
    size === "lg" ? "ahmed-cube-scene--lg" : size === "sm" ? "ahmed-cube-scene--sm" : "";
  return (
    <span
      className={`ahmed-cube-scene ${sizeClass} ${thinking ? "ahmed-cube-scene--think" : ""} ${className}`}
      aria-hidden="true"
    >
      <span className="ahmed-cube">
        <span className="ahmed-cube-face ahmed-cube-face--front">A</span>
        <span className="ahmed-cube-face ahmed-cube-face--right">H</span>
        <span className="ahmed-cube-face ahmed-cube-face--back">M</span>
        <span className="ahmed-cube-face ahmed-cube-face--left">E</span>
        <span className="ahmed-cube-face ahmed-cube-face--top">D</span>
        <span className="ahmed-cube-face ahmed-cube-face--bottom">.</span>
      </span>
    </span>
  );
}

function SkeletonBubble({ align = "left" }: { align?: "left" | "right" }) {
  return (
    <div className={`flex gap-2.5 ${align === "right" ? "justify-end" : "justify-start"}`}>
      {align === "left" && (
        <span
          className="mt-1 size-7 shrink-0 animate-pulse rounded-lg"
          style={{ background: "linear-gradient(135deg, #f0e6d6, #fbf5e9)" }}
        />
      )}
      <div
        className="max-w-[85%] animate-pulse rounded-2xl px-4 py-3"
        style={{
          background: align === "right"
            ? "linear-gradient(135deg, #d75e2e, #c24f24)"
            : "linear-gradient(135deg, #fffdfa, #faf6f0)",
          minHeight: 48,
        }}
      />
      {align === "right" && (
        <span
          className="mt-1 size-7 shrink-0 animate-pulse rounded-full"
          style={{ background: "linear-gradient(135deg, #f0e6d6, #fbf5e9)" }}
        />
      )}
    </div>
  );
}

function RevealInline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  let wordIndex = 0;
  const nodes: ReactNode[] = [];
  parts.forEach((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      nodes.push(<strong key={`b-${i}`}>{part.slice(2, -2)}</strong>);
      return;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      nodes.push(
        <code
          key={`c-${i}`}
          className="rounded px-1 py-0.5 text-[0.85em]"
          style={{ background: "rgba(215,94,46,.08)", color: ACCENT }}
        >
          {part.slice(1, -1)}
        </code>,
      );
      return;
    }
    const tokens = part.split(/(\s+)/);
    tokens.forEach((token, ti) => {
      if (token === "") return;
      if (/^\s+$/.test(token)) {
        nodes.push(token);
        return;
      }
      const delay = Math.min(wordIndex * 14, 480);
      wordIndex += 1;
      nodes.push(
        <span key={`w-${i}-${ti}`} className="reveal-word" style={{ animationDelay: `${delay}ms` }}>
          {token}
        </span>,
      );
    });
  });
  return <>{nodes}</>;
}

function MarkdownText({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="space-y-2">
      {blocks.map((block, bi) => {
        const lines = block.split("\n");
        const isList = lines.every((l) => /^[\s]*[-*]\s/.test(l) || /^\d+[.)]\s/.test(l));
        if (isList) {
          return (
            <ul key={bi} className="list-disc space-y-1 pl-4 text-xs leading-relaxed sm:text-sm">
              {lines.map((line, li) => (
                <li
                  key={li}
                  className="reveal-fade"
                  style={{ animationDelay: `${Math.min(li * 40, 320)}ms` }}
                >
                  <RevealInline text={line.replace(/^[\s]*[-*]\s*/, "")} />
                </li>
              ))}
            </ul>
          );
        }
        if (/^#{1,3}\s/.test(block)) {
          const heading = block.replace(/^#{1,3}\s*/, "");
          return (
            <p
              key={bi}
              className="reveal-fade m-0 font-semibold text-[#231d17]"
              style={{ animationDelay: `${Math.min(bi * 40, 320)}ms` }}
            >
              <RevealInline text={heading} />
            </p>
          );
        }
        if (/^```/.test(block)) {
          const code = block.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "");
          return (
            <pre
              key={bi}
              className="reveal-fade overflow-x-auto rounded-xl px-3 py-2 text-[11px] leading-relaxed"
              style={{ background: "#1a1612", color: "#faf5ee", animationDelay: `${Math.min(bi * 40, 320)}ms` }}
            >
              <code>{code}</code>
            </pre>
          );
        }
        return (
          <p
            key={bi}
            className="m-0 whitespace-pre-wrap break-words text-xs leading-relaxed sm:text-sm"
          >
            <RevealInline text={block} />
          </p>
        );
      })}
    </div>
  );
}

export default function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"agent" | "direct" | "account">("agent");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [account, setAccount] = useState<Account | null>(null);
  const [isCheckingAccount, setIsCheckingAccount] = useState(true);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<Conversation[]>([]);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesHasMore, setMessagesHasMore] = useState(false);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [directHasMore, setDirectHasMore] = useState(false);
  const [isLoadingMoreDirect, setIsLoadingMoreDirect] = useState(false);
  const [isLoadingDirect, setIsLoadingDirect] = useState(false);
  const [isSendingDirect, setIsSendingDirect] = useState(false);
  const [draftDirectMessage, setDraftDirectMessage] = useState("");
  const [unreadDirectCount, setUnreadDirectCount] = useState(0);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [usernameCheck, setUsernameCheck] = useState<{
    username: string;
    status: "available" | "taken" | "error";
  } | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Profile editing states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const editFileRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const directMessagesEndRef = useRef<HTMLDivElement>(null);
  const directScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pollingRef = useRef(false);

  const validUsername = /^[a-z0-9_]{3,32}$/.test(username);
  const usernameStatus: UsernameStatus = !username
    ? "idle"
    : !validUsername
      ? "invalid"
      : usernameCheck?.username === username
        ? usernameCheck.status
        : "checking";

  const loadHistory = useCallback(async (page = 0) => {
    setIsLoadingHistory(true);
    try {
      const payload = await requestJson(
        `/api/account/conversations?limit=${CONV_PAGE_SIZE}&offset=${page * CONV_PAGE_SIZE}`,
      );
      if (!isConvPage(payload)) throw new Error("Chat history returned an invalid response.");
      setHistory((current) =>
        page === 0 ? payload.items : [...current, ...payload.items],
      );
      setHistoryPage(page);
      setHistoryTotal(payload.total);
      setHistoryHasMore((page + 1) * CONV_PAGE_SIZE < payload.total);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chat history could not be loaded.");
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const loadDirectMessages = useCallback(async (isPolling = false, older = false) => {
    if (!isPolling) setIsLoadingDirect(true);
    if (older) setIsLoadingMoreDirect(true);
    try {
      const currentMessages = older ? await (async () => {
        const state = await new Promise<DirectMessage[]>((resolve) => {
          setDirectMessages((current) => {
            resolve(current);
            return current;
          });
        });
        return state;
      })() : [];
      const oldestId = older && currentMessages.length > 0 ? currentMessages[0].id : undefined;
      const qs = new URLSearchParams({ limit: String(DIRECT_PAGE_SIZE) });
      if (oldestId) qs.set("before", String(oldestId));
      const payload = await requestJson(`/api/account/messages?${qs}`);
      if (!isDirectThreadPage(payload)) return;
      const msgs = payload.thread.messages;
      const unread = payload.thread.unread;
      if (older) {
        setDirectMessages((current) => {
          const seen = new Set(current.map((m) => m.id));
          const fresh = msgs.filter((m) => !seen.has(m.id));
          return [...fresh, ...current];
        });
      } else {
        setDirectMessages(msgs);
      }
      setUnreadDirectCount(unread);
      setDirectHasMore(payload.thread.has_more);
    } catch {
      // Quietly fail during polling
    } finally {
      if (!isPolling) setIsLoadingDirect(false);
      if (older) setIsLoadingMoreDirect(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !account) return;
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const poll = async () => {
      if (pollingRef.current) return;
      pollingRef.current = true;
      try {
        await loadDirectMessages(true);
      } finally {
        pollingRef.current = false;
      }
    };

    void loadDirectMessages(false);
    intervalId = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      pollingRef.current = false;
    };
  }, [open, account, loadDirectMessages]);

  useEffect(() => {
    let active = true;
    void requestJson("/api/account/session")
      .then((payload) => {
        if (!isRecord(payload) || !isAccount(payload.account)) {
          throw new Error("Account details returned an invalid response.");
        }
        if (!active) return;
        setAccount(payload.account);
        void loadHistory(0);
        void loadDirectMessages(false);
      })
      .catch((error: unknown) => {
        const status = isRecord(error) && typeof error.status === "number" ? error.status : 0;
        if (active && status !== 401) {
          toast.error(error instanceof Error ? error.message : "Account service is unavailable.");
        }
      })
      .finally(() => {
        if (active) setIsCheckingAccount(false);
      });
    return () => {
      active = false;
    };
  }, [loadHistory]);

  useEffect(() => {
    if (authMode !== "create" || !validUsername) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetch(`/api/account/username-availability?username=${encodeURIComponent(username)}`, {
        cache: "no-store",
        signal: controller.signal,
      })
        .then(async (response) => {
          const payload: unknown = await response.json();
          if (!response.ok || !isRecord(payload) || typeof payload.available !== "boolean") {
            throw new Error(errorMessage(payload, "Username availability could not be checked."));
          }
          setUsernameCheck({ username, status: payload.available ? "available" : "taken" });
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setUsernameCheck({ username, status: "error" });
        });
    }, 350);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [authMode, username, validUsername]);

  useEffect(() => {
    if (!avatarPreview) return;
    return () => URL.revokeObjectURL(avatarPreview);
  }, [avatarPreview]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, isSending]);

  useEffect(() => {
    directMessagesEndRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [directMessages, isSendingDirect]);

  const acceptAccount = (payload: unknown) => {
    if (!isRecord(payload) || !isAccount(payload.account)) {
      throw new Error("Account details returned an invalid response.");
    }
    setAccount(payload.account);
    setActiveTab("agent");
    setAuthMode("login");
    setAuthError("");
    setMessages([]);
    setConversationId(null);
    setHistoryOpen(false);
    void loadHistory(0);
    void loadDirectMessages(false);
  };

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setIsSubmittingAuth(true);
    setAuthError("");
    try {
      const payload = await requestJson("/api/account/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: String(formData.get("username") ?? "").trim(),
          password: String(formData.get("password") ?? ""),
        }),
      });
      acceptAccount(payload);
      toast.success("Welcome back! Your chat is ready.");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Sign-in failed.";
      setAuthError(msg);
      toast.error(msg);
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const chooseAvatar = (file: File | undefined) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Choose a JPEG, PNG, or WebP profile image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Profile images must be 5 MB or smaller.");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const beginProfileEdit = () => {
    if (!account) return;
    setEditName(account.full_name);
    setEditEmail(account.email);
    setEditPhone(account.phone ?? "");
    setEditAvatarFile(null);
    setEditAvatarPreview(null);
    setIsEditingProfile(true);
  };

  const cancelProfileEdit = () => {
    setIsEditingProfile(false);
    setEditAvatarFile(null);
    setEditAvatarPreview(null);
    if (editFileRef.current) editFileRef.current.value = "";
  };

  const chooseEditAvatar = (file: File | undefined) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Choose a JPEG, PNG, or WebP profile image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Profile images must be 5 MB or smaller.");
      return;
    }
    setEditAvatarFile(file);
    setEditAvatarPreview(URL.createObjectURL(file));
  };

  useEffect(() => {
    if (!editAvatarPreview) return;
    return () => URL.revokeObjectURL(editAvatarPreview);
  }, [editAvatarPreview]);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!account || isSavingProfile) return;
    const name = editName.trim();
    if (name.length < 2) {
      toast.error("Please enter your full name.");
      return;
    }
    setIsSavingProfile(true);
    try {
      const data = new FormData();
      data.set("full_name", name);
      if (editEmail.trim()) data.set("email", editEmail.trim());
      data.set("phone", editPhone.trim());
      if (editAvatarFile) data.set("image", editAvatarFile);
      const payload = await requestJson("/api/account/profile", {
        method: "PATCH",
        body: data,
      });
      if (!isRecord(payload) || !isAccount(payload.account)) {
        throw new Error("Your profile returned an invalid response.");
      }
      setAccount(payload.account);
      setIsEditingProfile(false);
      setEditAvatarFile(null);
      setEditAvatarPreview(null);
      if (editFileRef.current) editFileRef.current.value = "";
      toast.success("Your profile has been updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Your profile could not be updated.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const submitRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^[a-z0-9_]{3,32}$/.test(username)) {
      toast.error("Use 3–32 lowercase letters, numbers, or underscores for your username.");
      return;
    }
    if (usernameStatus === "taken") {
      toast.error("That username is already taken. Please choose another one.");
      return;
    }
    if (usernameStatus === "checking" || usernameStatus === "idle") {
      toast.error("Wait for the username availability check to finish.");
      return;
    }
    const data = new FormData();
    data.set("full_name", fullName.trim());
    data.set("username", username);
    data.set("email", email.trim());
    data.set("password", String(new FormData(event.currentTarget).get("password") ?? ""));
    data.set("phone", phone.trim());
    if (avatarFile) data.set("image", avatarFile);
    setIsSubmittingAuth(true);
    setAuthError("");
    try {
      const payload = await requestJson("/api/account/register", { method: "POST", body: data });
      acceptAccount(payload);
      setAvatarFile(null);
      setAvatarPreview(null);
      toast.success("Your account is ready! You can now chat.");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Account creation failed.";
      setAuthError(msg);
      toast.error(msg);
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const signOut = async () => {
    setIsLoggingOut(true);
    try {
      await requestJson("/api/account/logout", { method: "POST" });
      setAccount(null);
      setHistory([]);
      setHistoryPage(0);
      setHistoryTotal(0);
      setMessages([]);
      setDirectMessages([]);
      setConversationId(null);
      setActiveTab("account");
      toast.success("You have signed out.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign-out failed.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const startNewChat = () => {
    setConversationId(null);
    setMessages([]);
    setMessagesHasMore(false);
    setHistoryOpen(false);
    setActiveTab("agent");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const openConversation = async (conversation: Conversation) => {
    setIsLoadingConversation(true);
    try {
      const payload = await requestJson(
        `/api/account/conversations/${conversation.id}?limit=${CHAT_PAGE_SIZE}&offset=0`,
      );
      if (
        !isRecord(payload) ||
        !Array.isArray(payload.messages) ||
        !payload.messages.every(isChatMessage)
      ) {
        throw new Error("This conversation returned an invalid response.");
      }
      setConversationId(conversation.id);
      setMessages(payload.messages);
      setMessagesHasMore(payload.has_more === true);
      setHistoryOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The conversation could not be opened.");
    } finally {
      setIsLoadingConversation(false);
    }
  };

  const loadOlderChatMessages = async () => {
    if (!conversationId || !messages.length || isLoadingMoreMessages) return;
    setIsLoadingMoreMessages(true);
    try {
      const oldestId = messages[0].id;
      const payload = await requestJson(
        `/api/account/conversations/${conversationId}?before=${oldestId}&limit=${CHAT_PAGE_SIZE}`,
      );
      if (!isRecord(payload) || !Array.isArray(payload.messages) || !payload.messages.every(isChatMessage)) {
        throw new Error("Could not load older messages.");
      }
      setMessages((current) => [...(payload.messages as ChatMessage[]), ...current]);
      setMessagesHasMore(payload.has_more === true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load older messages.");
    } finally {
      setIsLoadingMoreMessages(false);
    }
  };

  const removeConversation = async (conversation: Conversation) => {
    try {
      await requestJson(`/api/account/conversations/${conversation.id}`, { method: "DELETE" });
      setHistory((current) => {
        const next = current.filter((item) => item.id !== conversation.id);
        return next;
      });
      setHistoryTotal((t) => Math.max(0, t - 1));
      if (conversation.id === conversationId) startNewChat();
      toast.success("Conversation deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The conversation could not be deleted.");
    }
  };

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = draftMessage.trim();
    if (!message || isSending || !account) return;
    setDraftMessage("");
    setIsSending(true);
    try {
      const payload = await requestJson("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_id: conversationId, message }),
      });
      if (!isRecord(payload)) {
        throw new Error("The AI assistant returned an invalid response.");
      }
      const returnedConversation = payload.conversation;
      const returnedMessages = payload.messages;
      if (!isConversation(returnedConversation) || !isChatMessageArray(returnedMessages)) {
        throw new Error("The AI assistant returned an invalid response.");
      }
      setConversationId(returnedConversation.id);
      setMessages((current) => [...current, ...returnedMessages]);
      void loadHistory(0);
    } catch (error) {
      const status = isRecord(error) && typeof error.status === "number" ? error.status : 0;
      if (status === 401) {
        setAccount(null);
        setMessages([]);
        setConversationId(null);
        setActiveTab("account");
      }
      toast.error(error instanceof Error ? error.message : "Your message could not be sent.");
      setDraftMessage(message);
    } finally {
      setIsSending(false);
    }
  };

  const sendDirectMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = draftDirectMessage.trim();
    if (!message || isSendingDirect || !account) return;
    setDraftDirectMessage("");
    setIsSendingDirect(true);

    const optimisticMsg: DirectMessage = {
      id: Date.now(),
      sender_role: "user",
      content: message,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setDirectMessages((current) => [...current, optimisticMsg]);

    try {
      const payload = await requestJson("/api/account/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (isRecord(payload) && typeof payload.id === "number") {
        setDirectMessages((current) =>
          current.map((m) => (m.id === optimisticMsg.id ? (payload as DirectMessage) : m)),
        );
      }
      void loadDirectMessages(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Message could not be sent.");
      setDraftDirectMessage(message);
    } finally {
      setIsSendingDirect(false);
    }
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="group fixed bottom-5 right-5 z-40 flex size-14 items-center justify-center rounded-full text-[#faf5ee] shadow-[0_12px_32px_rgba(35,29,23,.28)] ring-1 ring-white/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(215,94,46,.3)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d75e2e] sm:bottom-7 sm:right-7"
          style={{ background: "linear-gradient(135deg, #d75e2e 0%, #c24f24 100%)" }}
          aria-label="Open AI assistant and messaging"
        >
          <span className="relative">
            <MessageCircle
              size={24}
              strokeWidth={1.8}
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:scale-110"
            />
            <span
              className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-[#fbf5e9]"
              style={{ background: ACCENT }}
              aria-hidden="true"
            />
          </span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-50 backdrop-blur-sm transition-opacity duration-200 data-[state=closed]:opacity-0"
          style={{ background: "rgba(22,18,14,.6)" }}
        />
        <Dialog.Content
          className="fixed inset-0 z-50 flex h-[100dvh] w-full flex-col overflow-hidden text-[#2b241b] shadow-2xl transition duration-200 data-[state=closed]:scale-[.98] data-[state=closed]:opacity-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-[min(800px,90dvh)] sm:w-[min(820px,calc(100vw-32px))] sm:max-h-[90dvh] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:border sm:border-[#e8dfd3] sm:shadow-[0_24px_70px_rgba(35,29,23,.22)]"
          style={{
            background: "linear-gradient(180deg, #fbf5e9 0%, #faf7f2 100%)",
          }}
        >
          {/* Header */}
          <header
            className="flex items-center justify-between gap-3 border-b border-[#ece2d5] px-5 py-3.5 sm:px-6"
            style={{ background: "linear-gradient(180deg, #fffdfa, #fbf5e9)" }}
          >
            <div className="flex min-w-0 items-center gap-3">
              {activeTab === "direct" ? (
                <div
                  className="relative size-10 shrink-0 overflow-hidden rounded-xl border border-[#ebdcc9] shadow-xs"
                  style={{ background: "linear-gradient(135deg, #f5ecdd, #fbf5e9)" }}
                >
                  <Image
                    src="/my-img1.png"
                    alt="Ahmed Bouramdane"
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                  <span
                    className="absolute bottom-0 right-0 size-2.5 rounded-full border border-white"
                    style={{ background: "#10b981" }}
                  />
                </div>
              ) : (
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#ebdcc9] shadow-xs"
                  style={{
                    background: "linear-gradient(135deg, #fbf5e9, #fffdfa)",
                    color: ACCENT,
                  }}
                  aria-hidden="true"
                >
                  <AhmedCube size="md" />
                </span>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Dialog.Title className="truncate font-[var(--font-display)] text-sm font-bold tracking-tight text-[#231d17]">
                    {activeTab === "direct" ? "Ahmed Bouramdane" : "Ahmed's Corner"}
                  </Dialog.Title>
                  <span
                    className="rounded-full px-2 py-0.5 font-[var(--font-mono)] text-[9px] font-semibold tracking-wide"
                    style={{ background: "#f4ebe0", color: "#a1552a" }}
                  >
                    {activeTab === "direct" ? "ADMIN" : "AI ASSISTANT"}
                  </span>
                </div>
                <Dialog.Description className="mt-0.5 truncate text-xs text-[#786a57]">
                  {activeTab === "direct"
                    ? "Direct live chat with the administrator"
                    : "Ask about projects, engineering, or robotics"}
                </Dialog.Description>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeTab === "agent" && account && (
                <button
                  type="button"
                  onClick={() => {
                    setHistoryOpen((value) => !value);
                    void loadHistory(0);
                  }}
                  className={`grid size-9 place-items-center rounded-xl border transition-all duration-200 ${
                    historyOpen
                      ? "border-[#d8c9b5] text-[#231d17]"
                      : "border-transparent text-[#786a57] hover:text-[#231d17]"
                  }`}
                  style={{
                    background: historyOpen ? "#f3ebd9" : "transparent",
                  }}
                  aria-label={historyOpen ? "Hide chat history" : "Show chat history"}
                  aria-pressed={historyOpen}
                >
                  <History size={17} aria-hidden="true" />
                </button>
              )}
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="grid size-9 place-items-center rounded-xl text-[#786a57] transition hover:bg-[#f5ecdd] hover:text-[#231d17]"
                  aria-label="Close dialog"
                >
                  <X size={19} />
                </button>
              </Dialog.Close>
            </div>
          </header>

          {/* Navigation Bar */}
          <div
            className="grid grid-cols-3 border-b border-[#ece2d5] px-3 sm:px-6"
            role="tablist"
            aria-label="Assistant sections"
            style={{ background: "linear-gradient(180deg, #fffdfa, #fbf5e9)" }}
          >
            <button
              type="button"
              role="tab"
              id="assistant-tab"
              aria-controls="assistant-panel"
              aria-selected={activeTab === "agent"}
              onClick={() => setActiveTab("agent")}
              className={`relative inline-flex min-h-12 items-center justify-center gap-1.5 text-xs font-semibold tracking-wide transition-all duration-200 sm:gap-2 ${
                activeTab === "agent" ? "text-[#231d17]" : "text-[#786a57] hover:text-[#231d17]"
              }`}
            >
              <Bot size={15} aria-hidden="true" />
              <span>AI Chat</span>
              {activeTab === "agent" && (
                <span
                  className="absolute inset-x-4 bottom-0 h-0.5 rounded-full transition-all duration-300"
                  style={{ background: ACCENT }}
                />
              )}
            </button>

            <button
              type="button"
              role="tab"
              id="direct-tab"
              aria-controls="direct-panel"
              aria-selected={activeTab === "direct"}
              onClick={() => {
                setActiveTab("direct");
                if (account) void loadDirectMessages(false);
              }}
              className={`relative inline-flex min-h-12 items-center justify-center gap-1.5 text-xs font-semibold tracking-wide transition-all duration-200 sm:gap-2 ${
                activeTab === "direct" ? "text-[#231d17]" : "text-[#786a57] hover:text-[#231d17]"
              }`}
            >
              <MessageSquare size={15} aria-hidden="true" />
              <span>Chat Admin</span>
              {unreadDirectCount > 0 && (
                <span
                  className="grid size-4 animate-pulse place-items-center rounded-full text-[9px] font-bold text-white"
                  style={{ background: ACCENT }}
                >
                  {unreadDirectCount}
                </span>
              )}
              {activeTab === "direct" && (
                <span
                  className="absolute inset-x-4 bottom-0 h-0.5 rounded-full transition-all duration-300"
                  style={{ background: ACCENT }}
                />
              )}
            </button>

            <button
              type="button"
              role="tab"
              id="account-tab"
              aria-controls="account-panel"
              aria-selected={activeTab === "account"}
              onClick={() => setActiveTab("account")}
              className={`relative inline-flex min-h-12 items-center justify-center gap-1.5 text-xs font-semibold tracking-wide transition-all duration-200 sm:gap-2 ${
                activeTab === "account" ? "text-[#231d17]" : "text-[#786a57] hover:text-[#231d17]"
              }`}
            >
              <UserRound size={15} aria-hidden="true" />
              <span>{account ? "My Profile" : "Account"}</span>
              {account && (
                <span
                  className="size-1.5 rounded-full"
                  style={{ background: "#10b981" }}
                  aria-label="Signed in"
                />
              )}
              {activeTab === "account" && (
                <span
                  className="absolute inset-x-4 bottom-0 h-0.5 rounded-full transition-all duration-300"
                  style={{ background: ACCENT }}
                />
              )}
            </button>
          </div>

          {/* TAB 1: AI Chat with Gemini */}
          {activeTab === "agent" && (
            <section
              id="assistant-panel"
              role="tabpanel"
              aria-labelledby="assistant-tab"
              className="relative flex min-h-0 flex-1 flex-col"
            >
              {!account ? (
                <div className="grid flex-1 place-items-center p-6 text-center sm:p-10">
                  <div
                    className="max-w-md rounded-3xl border border-[#ebdcc9] p-7 shadow-sm sm:p-9"
                    style={{ background: "linear-gradient(180deg, #fffdfa, #faf6f0)" }}
                  >
                    <span
                      className="mx-auto grid size-14 place-items-center rounded-2xl border border-[#ebdcc9] shadow-xs"
                      style={{
                        background: "linear-gradient(135deg, #fbf5e9, #fffdfa)",
                        color: ACCENT,
                      }}
                    >
                      <LockKeyhole size={24} />
                    </span>
                    <h2 className="mb-2 mt-5 font-[var(--font-display)] text-lg font-bold text-[#231d17]">
                      Sign in to chat with Ahmed&apos;s AI
                    </h2>
                    <p className="mb-6 text-xs leading-relaxed text-[#786a57]">
                      Conversations are saved privately to your account. Sign in or create a free
                      profile to explore projects, ask questions, and search verified sources.
                    </p>
                    <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode("login");
                          setAuthError("");
                          setActiveTab("account");
                        }}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-xs font-semibold text-[#faf5ee] shadow-sm transition-all duration-200 hover:brightness-110"
                        style={{ background: "linear-gradient(135deg, #d75e2e, #c24f24)" }}
                      >
                        <LogIn size={15} /> Sign in
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode("create");
                          setAuthError("");
                          setUsernameTouched(false);
                          setUsernameCheck(null);
                          setUsername(makeUsername(fullName));
                          setActiveTab("account");
                        }}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#e2d5c3] bg-white px-5 text-xs font-semibold text-[#2b241b] shadow-xs transition-all duration-200 hover:border-[#d75e2e] hover:text-[#d75e2e]"
                      >
                        <UserPlus size={15} /> Create account
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className="flex items-center justify-between gap-3 border-b border-[#ece2d5] px-4 py-2.5 sm:px-6"
                    style={{ background: "rgba(255,253,250,.8)" }}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar account={account} size={30} />
                      <div className="min-w-0">
                        <p className="m-0 truncate text-xs font-semibold text-[#231d17]">
                          {account.full_name}
                        </p>
                        <p className="m-0 text-[10px] text-[#786a57]">
                          Private session · @{account.username}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={startNewChat}
                      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-[#e2d5c3] bg-white px-3 text-xs font-medium text-[#2b241b] shadow-xs transition-all duration-200 hover:border-[#d75e2e] hover:text-[#d75e2e]"
                    >
                      <Plus size={14} /> New chat
                    </button>
                  </div>

                  {historyOpen && (
                    <aside
                      className="absolute inset-0 z-10 flex flex-col border-b border-[#ece2d5] bg-[#fffdfa] shadow-lg"
                      aria-label="Chat history"
                      style={{ background: "linear-gradient(180deg, #fffdfa, #fbf5e9)" }}
                    >
                      <div className="flex items-center justify-between border-b border-[#ece2d5] px-5 py-3">
                        <div className="flex items-center gap-2">
                          <History size={16} className="text-[#d75e2e]" />
                          <h2 className="m-0 text-xs font-bold uppercase tracking-wider text-[#231d17]">
                            Your conversations
                          </h2>
                          <span
                            className="rounded-full px-2 py-0.5 font-[var(--font-mono)] text-[9px] font-semibold"
                            style={{ background: "#f4ebe0", color: "#a1552a" }}
                          >
                            {historyTotal}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setHistoryOpen(false)}
                          className="grid size-8 place-items-center rounded-lg text-[#786a57] transition hover:bg-[#f5ecdd]"
                          aria-label="Close history"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div className="min-h-0 flex-1 overflow-y-auto p-3">
                        {isLoadingHistory && history.length === 0 ? (
                          <div className="space-y-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                              <div
                                key={i}
                                className="h-14 animate-pulse rounded-xl"
                                style={{ background: "linear-gradient(135deg, #f0e6d6, #fbf5e9)" }}
                              />
                            ))}
                          </div>
                        ) : history.length === 0 ? (
                          <p className="p-6 text-center text-xs leading-relaxed text-[#786a57]">
                            Your conversation history will appear here once you send a message.
                          </p>
                        ) : (
                          <>
                            {history.map((conversation) => (
                              <div
                                key={conversation.id}
                                className={`group flex items-center gap-1 rounded-xl p-1.5 transition-all duration-200 ${
                                  conversation.id === conversationId
                                    ? "border border-[#e4d8c7]"
                                    : "hover:bg-[#f7f0e3]"
                                }`}
                                style={{
                                  background: conversation.id === conversationId
                                    ? "linear-gradient(135deg, #f5ecdd, #f7f0e3)"
                                    : "transparent",
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => void openConversation(conversation)}
                                  className="min-w-0 flex-1 rounded-lg px-2.5 py-2 text-left"
                                  disabled={isLoadingConversation}
                                >
                                  <span className="block truncate text-xs font-semibold text-[#231d17]">
                                    {conversation.title}
                                  </span>
                                  <time
                                    className="mt-0.5 block font-[var(--font-mono)] text-[10px] text-[#786a57]"
                                    dateTime={conversation.updated_at}
                                  >
                                    {formatDate(conversation.updated_at)}
                                  </time>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void removeConversation(conversation)}
                                  className="grid size-7 shrink-0 place-items-center rounded-lg text-[#948471] opacity-100 transition hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100"
                                  aria-label={`Delete ${conversation.title}`}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))}
                            {historyHasMore && (
                              <button
                                type="button"
                                onClick={() => void loadHistory(historyPage + 1)}
                                disabled={isLoadingHistory}
                                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#e2d5c3] bg-white py-2.5 text-xs font-medium text-[#786a57] transition hover:border-[#d75e2e] hover:text-[#d75e2e]"
                              >
                                {isLoadingHistory ? (
                                  <LoaderCircle size={14} className="animate-spin" />
                                ) : (
                                  <ChevronDown size={14} />
                                )}
                                {isLoadingHistory ? "Loading…" : "Load more conversations"}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                      <div
                        className="border-t border-[#ece2d5] px-4 py-2.5 text-center text-[10px]"
                        style={{ background: "#faf6f0", color: "#786a57" }}
                      >
                        End-to-end encrypted session stored only in your private account.
                      </div>
                    </aside>
                  )}

                  <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
                    {messagesHasMore && !isLoadingConversation && (
                      <div className="mb-4 flex justify-center">
                        <button
                          type="button"
                          onClick={() => void loadOlderChatMessages()}
                          disabled={isLoadingMoreMessages}
                          className="inline-flex items-center gap-2 rounded-full border border-[#e2d5c3] bg-white px-4 py-1.5 text-[11px] font-medium text-[#786a57] shadow-xs transition hover:border-[#d75e2e] hover:text-[#d75e2e]"
                        >
                          {isLoadingMoreMessages ? (
                            <LoaderCircle size={13} className="animate-spin" />
                          ) : (
                            <ChevronUp size={13} />
                          )}
                          {isLoadingMoreMessages ? "Loading…" : "Load earlier messages"}
                        </button>
                      </div>
                    )}
                    {messages.length === 0 && !isLoadingConversation ? (
                      <div className="reveal-fade mx-auto flex min-h-full max-w-md flex-col items-center justify-center py-6 text-center">
                        <span className="cube-bob">
                          <AhmedCube size="lg" />
                        </span>
                        <h2 className="mb-2 mt-5 font-[var(--font-display)] text-base font-bold text-[#231d17]">
                          Hello, {account.full_name.split(/\s+/)[0]}.
                        </h2>
                        <p className="mb-0 text-xs leading-relaxed text-[#786a57]">
                          I&apos;m Ahmed&apos;s AI assistant. Ask about his software projects,
                          mathematics, robotics, or certifications. I can also search the web and
                          cite live sources.
                        </p>
                        <div className="mt-5 flex flex-wrap justify-center gap-2">
                          {[
                            "Tell me about Ahmed's projects",
                            "What is Ahmed studying at LYDEX?",
                            "Explain his Three.js Arduino project",
                            "What are his certifications?",
                          ].map((suggestion) => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => setDraftMessage(suggestion)}
                              className="rounded-full border border-[#e4d8c7] bg-white px-3.5 py-1.5 text-xs text-[#2b241b] shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#d75e2e] hover:text-[#d75e2e]"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mx-auto max-w-2xl space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex gap-2.5 ${
                              message.role === "user" ? "justify-end" : "justify-start"
                            }`}
                          >
                            {message.role === "assistant" && (
                              <span
                                className="mt-1 grid size-7 shrink-0 place-items-center rounded-lg text-[#fbf5e9]"
                                style={{ background: "linear-gradient(135deg, #d75e2e, #c24f24)" }}
                              >
                                <Bot size={15} />
                              </span>
                            )}
                            <div
                              className={`msg-pop max-w-[88%] rounded-2xl px-4 py-3 shadow-sm ${
                                message.role === "user"
                                  ? "rounded-br-sm text-[#faf6f0]"
                                  : "rounded-bl-sm border border-[#e8dfd3] bg-white text-[#2b241b] shadow-xs"
                              }`}
                              style={
                                message.role === "user"
                                  ? { background: "linear-gradient(135deg, #d75e2e, #c24f24)", ["--pop-origin" as string]: "bottom right" }
                                  : { ["--pop-origin" as string]: "bottom left" }
                              }
                            >
                              {message.role === "assistant" ? (
                                <MarkdownText text={message.content} />
                              ) : (
                                <p className="m-0 whitespace-pre-wrap break-words text-xs leading-relaxed sm:text-sm">
                                  {message.content}
                                </p>
                              )}
                              {message.sources.length > 0 && (
                                <div className="mt-3 border-t border-[#f0e6d6] pt-2">
                                  <p
                                    className="mb-1.5 flex items-center gap-1 font-[var(--font-mono)] text-[10px] font-semibold uppercase tracking-wider"
                                    style={{ color: "#a1552a" }}
                                  >
                                    <Check size={11} /> Grounded sources
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {message.sources.map((source) => (
                                      <a
                                        key={source.url}
                                        href={source.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex max-w-full items-center gap-1 truncate rounded-full border border-[#e8dfd3] bg-[#faf6f0] px-2.5 py-1 text-[10px] text-[#2b241b] transition hover:border-[#d75e2e] hover:text-[#d75e2e]"
                                      >
                                        <span className="truncate">{source.title}</span>
                                        <ExternalLink size={10} className="shrink-0 opacity-60" />
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            {message.role === "user" && <Avatar account={account} size={28} />}
                          </div>
                        ))}
                        {isSending && (
                          <div className="msg-pop flex items-center gap-2.5">
                            <span
                              className="grid size-7 shrink-0 place-items-center rounded-lg text-[#fbf5e9]"
                              style={{ background: "linear-gradient(135deg, #d75e2e, #c24f24)" }}
                            >
                              <Bot size={15} />
                            </span>
                            <div className="flex items-center gap-3 rounded-2xl rounded-bl-sm border border-[#e8dfd3] bg-white px-3.5 py-2.5 shadow-xs">
                              <AhmedCube size="md" thinking />
                              <span className="text-[11px] text-[#786a57]">
                                Ahmed&apos;s assistant is thinking…
                              </span>
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                    {isLoadingConversation && (
                      <div className="absolute inset-0 grid place-items-center bg-[#faf7f2]/80 backdrop-blur-xs">
                        <div className="space-y-3">
                          <AhmedCube size="md" thinking className="mx-auto" />
                          <p className="text-xs text-[#786a57]">Loading conversation…</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <form
                    onSubmit={sendMessage}
                    className="border-t border-[#ece2d5] px-3.5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:pb-4"
                    style={{ background: "linear-gradient(180deg, #fffdfa, #fbf5e9)" }}
                  >
                    <div
                      className="mx-auto flex max-w-2xl items-end gap-2 rounded-2xl border border-[#e4d8c7] p-2 transition-all duration-200 focus-within:border-[#d75e2e] focus-within:ring-3 focus-within:ring-[#d75e2e]/10"
                      style={{ background: "rgba(251,245,233,.7)" }}
                    >
                      <textarea
                        ref={inputRef}
                        value={draftMessage}
                        onChange={(event) => setDraftMessage(event.target.value)}
                        onKeyDown={handleComposerKeyDown}
                        maxLength={2000}
                        rows={1}
                        placeholder="Ask Ahmed's assistant anything…"
                        aria-label="Your message"
                        className="max-h-28 min-h-10 flex-1 resize-y bg-transparent px-2.5 py-2 text-xs leading-relaxed text-[#231d17] outline-none placeholder:text-[#948471] sm:text-sm"
                        disabled={isSending}
                      />
                      <button
                        type="submit"
                        disabled={!draftMessage.trim() || isSending}
                        className="grid size-10 shrink-0 place-items-center rounded-xl text-[#faf5ee] shadow-xs transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                        style={{ background: "linear-gradient(135deg, #d75e2e, #c24f24)" }}
                        aria-label="Send message"
                      >
                        {isSending ? (
                          <LoaderCircle size={17} className="animate-spin" />
                        ) : (
                          <Send size={16} />
                        )}
                      </button>
                    </div>
                    <p className="mx-auto mb-0 mt-2 max-w-2xl text-center text-[10px] leading-relaxed text-[#948471]">
                      AI responses are grounded with Ahmed&apos;s verified profile and web search.
                    </p>
                  </form>
                </>
              )}
            </section>
          )}

          {/* TAB 2: Direct WhatsApp-style chat with Admin Ahmed Bouramdane */}
          {activeTab === "direct" && (
            <section
              id="direct-panel"
              role="tabpanel"
              aria-labelledby="direct-tab"
              className="relative flex min-h-0 flex-1 flex-col"
            >
              {!account ? (
                <div className="grid flex-1 place-items-center p-6 text-center sm:p-10">
                  <div
                    className="max-w-md rounded-3xl border border-[#ebdcc9] p-7 shadow-sm sm:p-9"
                    style={{ background: "linear-gradient(180deg, #fffdfa, #faf6f0)" }}
                  >
                    <div
                      className="relative mx-auto size-16 overflow-hidden rounded-2xl border border-[#ebdcc9] shadow-xs"
                      style={{ background: "linear-gradient(135deg, #f5ecdd, #fbf5e9)" }}
                    >
                      <Image
                        src="/my-img1.png"
                        alt="Ahmed Bouramdane"
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    <h2 className="mb-1 mt-4 font-[var(--font-display)] text-lg font-bold text-[#231d17]">
                      Chat directly with Ahmed
                    </h2>
                    <p className="mb-6 text-xs leading-relaxed text-[#786a57]">
                      Sign in or create a free account to message Ahmed Bouramdane directly. Ahmed
                      receives your messages in his live administrator inbox and can respond to you in
                      real time.
                    </p>
                    <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode("login");
                          setAuthError("");
                          setActiveTab("account");
                        }}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-xs font-semibold text-[#faf5ee] shadow-sm transition-all duration-200 hover:brightness-110"
                        style={{ background: "linear-gradient(135deg, #d75e2e, #c24f24)" }}
                      >
                        <LogIn size={15} /> Sign in to message
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode("create");
                          setAuthError("");
                          setUsernameTouched(false);
                          setUsernameCheck(null);
                          setUsername(makeUsername(fullName));
                          setActiveTab("account");
                        }}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#e2d5c3] bg-white px-5 text-xs font-semibold text-[#2b241b] shadow-xs transition-all duration-200 hover:border-[#d75e2e] hover:text-[#d75e2e]"
                      >
                        <UserPlus size={15} /> Create account
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Admin info bar */}
                  <div
                    className="flex items-center justify-between border-b border-[#ece2d5] px-4 py-2.5 sm:px-6"
                    style={{ background: "linear-gradient(180deg, #fffdfa, #fbf5e9)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="relative size-10 overflow-hidden rounded-xl border border-[#ebdcc9] shadow-xs"
                        style={{ background: "linear-gradient(135deg, #f5ecdd, #fbf5e9)" }}
                      >
                        <Image
                          src="/my-img1.png"
                          alt="Ahmed Bouramdane"
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                        <span
                          className="absolute bottom-0 right-0 size-2.5 rounded-full border border-white"
                          style={{ background: "#10b981" }}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="m-0 text-xs font-bold text-[#231d17]">Ahmed Bouramdane</h3>
                          <span
                            className="rounded-full px-2 py-0.5 text-[9px] font-semibold"
                            style={{ background: "#e8f5e9", color: "#1e7e34" }}
                          >
                            Online
                          </span>
                        </div>
                        <p className="m-0 text-[10px] text-[#786a57]">
                          Portfolio Creator · Replies in real time
                        </p>
                      </div>
                    </div>
                    <span
                      className="font-[var(--font-mono)] text-[10px]"
                      style={{ color: "#a1552a" }}
                    >
                      LIVE MESSAGING
                    </span>
                  </div>

                  {/* Messages Canvas */}
                  <div
                    ref={directScrollRef}
                    className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6"
                  >
                    {directHasMore && !isLoadingDirect && (
                      <div className="mb-4 flex justify-center">
                        <button
                          type="button"
                          onClick={() => void loadDirectMessages(false, true)}
                          disabled={isLoadingMoreDirect}
                          className="inline-flex items-center gap-2 rounded-full border border-[#e2d5c3] bg-white px-4 py-1.5 text-[11px] font-medium text-[#786a57] shadow-xs transition hover:border-[#d75e2e] hover:text-[#d75e2e]"
                        >
                          {isLoadingMoreDirect ? (
                            <LoaderCircle size={13} className="animate-spin" />
                          ) : (
                            <ChevronUp size={13} />
                          )}
                          {isLoadingMoreDirect ? "Loading…" : "Load earlier messages"}
                        </button>
                      </div>
                    )}
                    {isLoadingDirect && directMessages.length === 0 ? (
                      <div className="flex flex-col items-center gap-3 py-6">
                        <AhmedCube size="md" thinking />
                        <p className="text-[11px] text-[#786a57]">Opening your conversation…</p>
                        <div className="mt-2 w-full space-y-3">
                          <SkeletonBubble align="left" />
                          <SkeletonBubble align="right" />
                          <SkeletonBubble align="left" />
                        </div>
                      </div>
                    ) : directMessages.length === 0 ? (
                      <div className="mx-auto flex min-h-full max-w-sm flex-col items-center justify-center py-6 text-center">
                        <div
                          className="relative size-16 overflow-hidden rounded-2xl border border-[#ebdcc9] shadow-xs"
                          style={{ background: "linear-gradient(135deg, #f5ecdd, #fbf5e9)" }}
                        >
                          <Image
                            src="/my-img1.png"
                            alt="Ahmed Bouramdane"
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                        <h3 className="mb-1 mt-3 text-sm font-bold text-[#231d17]">
                          Say hello to Ahmed
                        </h3>
                        <p className="mb-4 text-xs leading-relaxed text-[#786a57]">
                          Send a message to discuss project collaboration, ask technical questions,
                          or just say hi. Ahmed will reply here from his admin dashboard!
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                          {[
                            "Hi Ahmed! I really liked your portfolio.",
                            "Would love to connect regarding a project.",
                            "How did you build the 3D game with Arduino?",
                          ].map((prompt) => (
                            <button
                              key={prompt}
                              type="button"
                              onClick={() => setDraftDirectMessage(prompt)}
                              className="rounded-full border border-[#e4d8c7] bg-white px-3 py-1.5 text-xs text-[#2b241b] shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#d75e2e] hover:text-[#d75e2e]"
                            >
                              {prompt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mx-auto max-w-2xl space-y-3">
                        {directMessages.map((msg) => {
                          const isMe = msg.sender_role === "user";
                          return (
                            <div
                              key={msg.id}
                              className={`msg-pop flex gap-2.5 ${
                                isMe ? "justify-end" : "justify-start"
                              }`}
                              style={{ ["--pop-origin" as string]: isMe ? "bottom right" : "bottom left" }}
                            >
                              {!isMe && (
                                <div
                                  className="relative mt-1 size-7 shrink-0 overflow-hidden rounded-lg border border-[#ebdcc9]"
                                  style={{ background: "linear-gradient(135deg, #f5ecdd, #fbf5e9)" }}
                                >
                                  <Image
                                    src="/my-img1.png"
                                    alt="Ahmed Bouramdane"
                                    fill
                                    className="object-cover"
                                    sizes="28px"
                                  />
                                </div>
                              )}
                              <div
                                className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-xs ${
                                  isMe
                                    ? "rounded-br-sm text-[#faf6f0]"
                                    : "rounded-bl-sm border border-[#e8dfd3] bg-white text-[#2b241b]"
                                }`}
                                style={
                                  isMe
                                    ? { background: "linear-gradient(135deg, #d75e2e, #c24f24)" }
                                    : undefined
                                }
                              >
                                {!isMe && (
                                  <span
                                    className="mb-1 block text-xs font-semibold"
                                    style={{ color: "#a1552a" }}
                                  >
                                    Ahmed Bouramdane
                                  </span>
                                )}
                                <p className="m-0 whitespace-pre-wrap break-words text-xs leading-relaxed sm:text-sm">
                                  {msg.content}
                                </p>
                                <div
                                  className={`mt-1.5 flex items-center justify-end gap-1 font-[var(--font-mono)] text-[9px] ${
                                    isMe ? "text-neutral-400" : "text-[#948471]"
                                  }`}
                                >
                                  <time dateTime={msg.created_at}>{formatTime(msg.created_at)}</time>
                                  {isMe &&
                                    (msg.is_read ? (
                                      <CheckCheck size={12} className="text-[#34d399]" />
                                    ) : (
                                      <Check size={12} className="text-neutral-400" />
                                    ))}
                                </div>
                              </div>
                              {isMe && <Avatar account={account} size={28} />}
                            </div>
                          );
                        })}
                        <div ref={directMessagesEndRef} />
                      </div>
                    )}
                  </div>

                  {/* Direct Message Composer */}
                  <form
                    onSubmit={sendDirectMessage}
                    className="border-t border-[#ece2d5] px-3.5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:pb-4"
                    style={{ background: "linear-gradient(180deg, #fffdfa, #fbf5e9)" }}
                  >
                    <div
                      className="mx-auto flex max-w-2xl items-end gap-2 rounded-2xl border border-[#e4d8c7] p-2 transition-all duration-200 focus-within:border-[#d75e2e] focus-within:ring-3 focus-within:ring-[#d75e2e]/10"
                      style={{ background: "rgba(251,245,233,.7)" }}
                    >
                      <textarea
                        value={draftDirectMessage}
                        onChange={(event) => setDraftDirectMessage(event.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            e.currentTarget.form?.requestSubmit();
                          }
                        }}
                        maxLength={2000}
                        rows={1}
                        placeholder="Type a message to Ahmed… (Enter to send)"
                        aria-label="Your message to Ahmed"
                        className="max-h-28 min-h-10 flex-1 resize-y bg-transparent px-2.5 py-2 text-xs leading-relaxed text-[#231d17] outline-none placeholder:text-[#948471] sm:text-sm"
                        disabled={isSendingDirect}
                      />
                      <button
                        type="submit"
                        disabled={!draftDirectMessage.trim() || isSendingDirect}
                        className="grid size-10 shrink-0 place-items-center rounded-xl text-[#faf5ee] shadow-xs transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                        style={{ background: "linear-gradient(135deg, #d75e2e, #c24f24)" }}
                        aria-label="Send direct message"
                      >
                        {isSendingDirect ? (
                          <LoaderCircle size={17} className="animate-spin" />
                        ) : (
                          <Send size={16} />
                        )}
                      </button>
                    </div>
                    <p className="mx-auto mb-0 mt-2 max-w-2xl text-center text-[10px] leading-relaxed text-[#948471]">
                      Real-time messenger · Messages reach Ahmed&apos;s admin dashboard instantly.
                    </p>
                  </form>
                </>
              )}
            </section>
          )}

          {/* TAB 3: My Account / Profile & Auth */}
          {activeTab === "account" && (
            <section
              id="account-panel"
              role="tabpanel"
              aria-labelledby="account-tab"
              className="min-h-0 flex-1 overflow-y-auto"
            >
              {isCheckingAccount ? (
                <div className="grid min-h-full place-items-center text-xs text-[#786a57]">
                  <span className="flex items-center gap-2">
                    <LoaderCircle size={17} className="animate-spin text-[#d75e2e]" /> Checking your
                    session…
                  </span>
                </div>
              ) : account ? (
                <div className="mx-auto max-w-md p-5 sm:p-8">
                  {isEditingProfile ? (
                    <form
                      onSubmit={saveProfile}
                      className="reveal-fade space-y-4 rounded-3xl border border-[#ebdcc9] p-5 shadow-xs sm:p-6"
                      style={{ background: "linear-gradient(180deg, #fffdfa, #fbf5e9)" }}
                    >
                      <div className="flex items-center justify-between border-b border-[#ece2d5] pb-3">
                        <h2 className="m-0 font-[var(--font-display)] text-sm font-bold text-[#231d17]">
                          Edit your profile
                        </h2>
                        <button
                          type="button"
                          onClick={cancelProfileEdit}
                          className="grid size-8 place-items-center rounded-lg text-[#786a57] transition hover:bg-[#f5ecdd] hover:text-[#231d17]"
                          aria-label="Cancel editing"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div className="flex items-center gap-4 rounded-2xl border border-[#ebdcc9] bg-[#fbf5e9]/60 p-3.5">
                        <span
                          className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full border border-[#e2d5c3]"
                          style={{ background: "linear-gradient(135deg, #f5ecdd, #fbf5e9)", color: "#a1552a" }}
                        >
                          {editAvatarPreview ? (
                            <ProjectImage
                              src={editAvatarPreview}
                              alt="Profile preview"
                              className="size-full object-cover"
                              sizes="64px"
                            />
                          ) : account.avatar_image ? (
                            <ProjectImage
                              src={account.avatar_image}
                              alt="Current profile"
                              className="size-full object-cover"
                              sizes="64px"
                            />
                          ) : (
                            <UserRound size={28} aria-hidden="true" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="m-0 text-xs font-semibold text-[#231d17]">Profile photo</p>
                          <p className="m-0 text-[10px] text-[#786a57]">JPEG, PNG, or WebP up to 5 MB</p>
                          <div className="mt-1.5 flex items-center gap-2">
                            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#e2d5c3] bg-white px-3 py-1.5 text-[11px] font-medium text-[#231d17] shadow-xs transition hover:bg-[#fbf5e9]">
                              <ImagePlus size={13} className="text-[#d75e2e]" />
                              <span>{editAvatarFile ? "Change photo" : "Choose photo"}</span>
                              <input
                                ref={editFileRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="sr-only"
                                onChange={(e) => chooseEditAvatar(e.currentTarget.files?.[0])}
                              />
                            </label>
                            {editAvatarPreview && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditAvatarFile(null);
                                  setEditAvatarPreview(null);
                                  if (editFileRef.current) editFileRef.current.value = "";
                                }}
                                className="text-[11px] text-red-600 hover:underline"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-[#231d17]">
                          <UserRound size={13} className="text-[#d75e2e]" />
                          Full name
                        </label>
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          required
                          minLength={2}
                          maxLength={100}
                          autoComplete="name"
                          className="min-h-10 w-full rounded-xl border border-[#e2d5c3] bg-white px-3.5 text-xs text-[#231d17] shadow-xs outline-none transition placeholder:text-[#948471] hover:border-[#cfbfa9] focus:border-[#d75e2e] focus:ring-3 focus:ring-[#d75e2e]/10 sm:text-sm"
                          placeholder="Your full name"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-[#231d17]">
                          <AtSign size={13} className="text-[#d75e2e]" />
                          Username
                        </label>
                        <input
                          value={account.username}
                          disabled
                          className="min-h-10 w-full cursor-not-allowed rounded-xl border border-[#e2d5c3] bg-[#f3ebdd] px-3.5 text-xs text-[#948471] shadow-xs outline-none sm:text-sm"
                        />
                        <span className="block text-[10px] text-[#948471]">
                          Your username is permanent and cannot be changed.
                        </span>
                      </div>

                      <div className="space-y-1">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-[#231d17]">
                          <Mail size={13} className="text-[#d75e2e]" />
                          Email address
                        </label>
                        <input
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          type="email"
                          maxLength={254}
                          autoComplete="email"
                          className="min-h-10 w-full rounded-xl border border-[#e2d5c3] bg-white px-3.5 text-xs text-[#231d17] shadow-xs outline-none transition placeholder:text-[#948471] hover:border-[#cfbfa9] focus:border-[#d75e2e] focus:ring-3 focus:ring-[#d75e2e]/10 sm:text-sm"
                          placeholder="you@example.com"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="flex items-center justify-between text-xs font-semibold text-[#231d17]">
                          <span className="flex items-center gap-1.5">
                            <Phone size={13} className="text-[#d75e2e]" />
                            Phone number
                          </span>
                          <span className="font-normal text-[#786a57]">Optional</span>
                        </label>
                        <input
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          type="tel"
                          maxLength={30}
                          autoComplete="tel"
                          className="min-h-10 w-full rounded-xl border border-[#e2d5c3] bg-white px-3.5 text-xs text-[#231d17] shadow-xs outline-none transition placeholder:text-[#948471] hover:border-[#cfbfa9] focus:border-[#d75e2e] focus:ring-3 focus:ring-[#d75e2e]/10 sm:text-sm"
                          placeholder="+212 …"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2.5 border-t border-[#ece2d5] pt-4">
                        <button
                          type="button"
                          onClick={cancelProfileEdit}
                          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#e2d5c3] bg-white px-4 text-xs font-semibold text-[#2b241b] shadow-xs transition hover:bg-[#fbf5e9]"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingProfile}
                          className="inline-flex min-h-10 items-center gap-2 rounded-xl px-5 text-xs font-semibold text-[#faf5ee] shadow-sm transition-all duration-200 hover:brightness-110 disabled:opacity-60"
                          style={{ background: "linear-gradient(135deg, #d75e2e, #c24f24)" }}
                        >
                          {isSavingProfile ? (
                            <LoaderCircle size={15} className="animate-spin" />
                          ) : (
                            <Save size={15} />
                          )}
                          {isSavingProfile ? "Saving…" : "Save changes"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      {/* Profile Card */}
                      <div
                        className="flex items-center gap-4 rounded-3xl border border-[#ebdcc9] p-5 shadow-xs"
                        style={{ background: "linear-gradient(180deg, #fffdfa, #fbf5e9)" }}
                      >
                        <Avatar account={account} size={64} />
                        <div className="min-w-0 flex-1">
                          <span
                            className="font-[var(--font-mono)] text-[9px] font-semibold uppercase tracking-wider"
                            style={{ color: "#a1552a" }}
                          >
                            AUTHENTICATED USER
                          </span>
                          <h2 className="mb-0 mt-1 truncate font-[var(--font-display)] text-base font-bold text-[#231d17]">
                            {account.full_name}
                          </h2>
                          <p className="mb-0 mt-0.5 truncate font-[var(--font-mono)] text-xs text-[#786a57]">
                            @{account.username}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={beginProfileEdit}
                          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-[#e2d5c3] bg-white px-3 text-xs font-semibold text-[#2b241b] shadow-xs transition-all duration-200 hover:border-[#d75e2e] hover:text-[#d75e2e]"
                        >
                          <Pencil size={14} /> Edit
                        </button>
                      </div>

                      {/* Direct chat CTA */}
                      <div
                        className="mt-4 flex items-center justify-between rounded-2xl border p-4"
                        style={{
                          borderColor: "rgba(215,94,46,.2)",
                          background: "linear-gradient(135deg, #fbf5e9, #f5ecdd)",
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="relative size-10 overflow-hidden rounded-xl border border-[#ebdcc9]"
                            style={{ background: "linear-gradient(135deg, #f5ecdd, #fbf5e9)" }}
                          >
                            <Image
                              src="/my-img1.png"
                              alt="Ahmed Bouramdane"
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                          <div>
                            <h4 className="m-0 text-xs font-bold text-[#231d17]">Chat with Ahmed</h4>
                            <p className="m-0 text-[10px] text-[#786a57]">
                              Ask questions or discuss opportunities directly
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab("direct")}
                          className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-[#faf5ee] shadow-sm transition-all duration-200 hover:brightness-110"
                          style={{ background: "linear-gradient(135deg, #d75e2e, #c24f24)" }}
                        >
                          <MessageSquare size={13} /> Chat now
                        </button>
                      </div>

                      <dl
                        className="my-5 divide-y divide-[#ece2d5] rounded-2xl border border-[#ebdcc9] px-4 shadow-xs"
                        style={{ background: "linear-gradient(180deg, #fffdfa, #faf6f0)" }}
                      >
                        <div className="flex justify-between gap-3 py-3">
                          <dt className="text-xs text-[#786a57]">Email address</dt>
                          <dd className="m-0 break-all text-right text-xs font-medium text-[#231d17]">
                            {account.email}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-3 py-3">
                          <dt className="text-xs text-[#786a57]">Phone number</dt>
                          <dd className="m-0 text-right text-xs font-medium text-[#231d17]">
                            {account.phone || "Not provided"}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-3 py-3">
                          <dt className="text-xs text-[#786a57]">Access role</dt>
                          <dd className="m-0 text-right text-xs font-medium capitalize text-[#231d17]">
                            {account.role}
                          </dd>
                        </div>
                      </dl>

                      <div
                        className="mb-5 flex items-start gap-2.5 rounded-2xl border border-[#e8dfd3] p-3.5 text-xs leading-relaxed"
                        style={{ background: "rgba(251,245,233,.7)", color: "#645845" }}
                      >
                        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#d75e2e]" />
                        <span>
                          Your session is protected with an HTTP-only secure cookie. Your messages and
                          saved chat threads are strictly private.
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => void signOut()}
                          disabled={isLoggingOut}
                          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#e2d5c3] bg-white px-4 text-xs font-semibold text-[#2b241b] shadow-xs transition hover:bg-[#fbf5e9] disabled:opacity-60"
                        >
                          <LogOut size={14} />
                          {isLoggingOut ? "Signing out…" : "Sign out"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("agent")}
                          className="inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-xs font-semibold text-[#faf5ee] shadow-sm transition-all duration-200 hover:brightness-110"
                          style={{ background: "linear-gradient(135deg, #d75e2e, #c24f24)" }}
                        >
                          AI Assistant <ArrowRight size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="mx-auto max-w-md p-5 sm:p-7">
                  {/* Segmented Auth Selector */}
                  <div
                    className="mb-6 grid grid-cols-2 rounded-2xl border border-[#e4d8c7] p-1 shadow-inner"
                    role="group"
                    aria-label="Account action"
                    style={{ background: "rgba(240,230,214,.7)" }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("login");
                        setAuthError("");
                      }}
                      className={`rounded-xl py-2.5 text-xs font-semibold transition-all duration-200 ${
                        authMode === "login"
                          ? "bg-white text-[#231d17] shadow-xs"
                          : "text-[#786a57] hover:text-[#231d17]"
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("create");
                        setAuthError("");
                        setUsernameTouched(false);
                        setUsernameCheck(null);
                        setUsername(makeUsername(fullName));
                      }}
                      className={`rounded-xl py-2.5 text-xs font-semibold transition-all duration-200 ${
                        authMode === "create"
                          ? "bg-white text-[#231d17] shadow-xs"
                          : "text-[#786a57] hover:text-[#231d17]"
                      }`}
                    >
                      Create Account
                    </button>
                  </div>

                  {authError && (
                    <div
                      className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700"
                      role="alert"
                    >
                      {authError}
                    </div>
                  )}

                  {authMode === "login" ? (
                    <form className="space-y-4" onSubmit={submitLogin}>
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-[#231d17]">
                          <AtSign size={13} className="text-[#d75e2e]" />
                          Username or email
                        </label>
                        <input
                          name="username"
                          type="text"
                          autoComplete="username"
                          required
                          maxLength={254}
                          className="min-h-11 w-full rounded-xl border border-[#e2d5c3] bg-white px-3.5 text-xs text-[#231d17] shadow-xs outline-none transition placeholder:text-[#948471] hover:border-[#cfbfa9] focus:border-[#d75e2e] focus:ring-3 focus:ring-[#d75e2e]/10 sm:text-sm"
                          placeholder="ahmed or you@example.com"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-[#231d17]">
                          <LockKeyhole size={13} className="text-[#d75e2e]" />
                          Password
                        </label>
                        <input
                          name="password"
                          type="password"
                          autoComplete="current-password"
                          required
                          maxLength={128}
                          className="min-h-11 w-full rounded-xl border border-[#e2d5c3] bg-white px-3.5 text-xs text-[#231d17] shadow-xs outline-none transition placeholder:text-[#948471] hover:border-[#cfbfa9] focus:border-[#d75e2e] focus:ring-3 focus:ring-[#d75e2e]/10 sm:text-sm"
                          placeholder="Your account password"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingAuth}
                        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-xs font-semibold text-[#faf5ee] shadow-sm transition-all duration-200 hover:brightness-110 disabled:opacity-60"
                        style={{ background: "linear-gradient(135deg, #d75e2e, #c24f24)" }}
                      >
                        {isSubmittingAuth ? (
                          <LoaderCircle size={15} className="animate-spin" />
                        ) : (
                          <LogIn size={15} />
                        )}
                        {isSubmittingAuth ? "Signing in…" : "Sign In Securely"}
                      </button>

                      <p className="pt-2 text-center text-xs text-[#786a57]">
                        Don&apos;t have an account?{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode("create");
                            setAuthError("");
                            setUsernameTouched(false);
                            setUsernameCheck(null);
                            setUsername(makeUsername(fullName));
                          }}
                          className="font-semibold text-[#d75e2e] underline-offset-2 hover:underline"
                        >
                          Create one now
                        </button>
                      </p>
                    </form>
                  ) : (
                    <form className="space-y-3.5" onSubmit={submitRegistration}>
                      {/* Avatar Picker */}
                      <div
                        className="flex items-center gap-4 rounded-2xl border border-[#ebdcc9] p-3 shadow-xs"
                        style={{ background: "linear-gradient(180deg, #fffdfa, #faf6f0)" }}
                      >
                        <span
                          className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-full border border-[#e2d5c3]"
                          style={{ background: "linear-gradient(135deg, #f5ecdd, #fbf5e9)", color: "#a1552a" }}
                        >
                          {avatarPreview ? (
                            <ProjectImage
                              src={avatarPreview}
                              alt="Profile avatar preview"
                              className="size-full object-cover"
                              sizes="56px"
                            />
                          ) : (
                            <UserRound size={26} aria-hidden="true" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="m-0 text-xs font-semibold text-[#231d17]">Profile picture</p>
                          <p className="m-0 text-[10px] text-[#786a57]">JPEG, PNG, or WebP up to 5 MB</p>
                          <div className="mt-1.5 flex items-center gap-2">
                            <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#e2d5c3] bg-white px-2.5 py-1 text-[11px] font-medium text-[#231d17] shadow-xs transition hover:bg-[#fbf5e9]">
                              <ImagePlus size={12} className="text-[#d75e2e]" />
                              <span>{avatarFile ? "Change photo" : "Choose photo"}</span>
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="sr-only"
                                onChange={(event) => {
                                  chooseAvatar(event.currentTarget.files?.[0]);
                                }}
                              />
                            </label>
                            {avatarFile && (
                              <button
                                type="button"
                                onClick={removeAvatar}
                                className="text-[11px] text-red-600 hover:underline"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-[#231d17]">
                          <UserRound size={13} className="text-[#d75e2e]" />
                          Full name
                        </label>
                        <input
                          value={fullName}
                          onChange={(event) => {
                            setFullName(event.target.value);
                            if (!usernameTouched) {
                              setUsername(makeUsername(event.target.value));
                              setUsernameCheck(null);
                            }
                          }}
                          autoComplete="name"
                          required
                          minLength={2}
                          maxLength={100}
                          className="min-h-10 w-full rounded-xl border border-[#e2d5c3] bg-white px-3.5 text-xs text-[#231d17] shadow-xs outline-none transition placeholder:text-[#948471] hover:border-[#cfbfa9] focus:border-[#d75e2e] focus:ring-3 focus:ring-[#d75e2e]/10 sm:text-sm"
                          placeholder="Your full name"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-[#231d17]">
                          <AtSign size={13} className="text-[#d75e2e]" />
                          Username
                        </label>
                        <div className="relative">
                          <input
                            value={username}
                            onChange={(event) => {
                              setUsernameTouched(true);
                              setUsernameCheck(null);
                              setUsername(event.target.value.toLowerCase().replace(/\s+/g, "_"));
                            }}
                            autoComplete="username"
                            required
                            minLength={3}
                            maxLength={32}
                            pattern="[a-z0-9_]{3,32}"
                            className="min-h-10 w-full rounded-xl border border-[#e2d5c3] bg-white px-3.5 pr-9 text-xs text-[#231d17] shadow-xs outline-none transition placeholder:text-[#948471] hover:border-[#cfbfa9] focus:border-[#d75e2e] focus:ring-3 focus:ring-[#d75e2e]/10 sm:text-sm"
                            placeholder="your_handle"
                          />
                          <div className="absolute right-3 top-2.5">
                            {usernameStatus === "checking" && (
                              <LoaderCircle size={15} className="animate-spin text-[#d75e2e]" />
                            )}
                            {usernameStatus === "available" && (
                              <Check size={15} className="text-[#10b981]" />
                            )}
                          </div>
                        </div>
                        <span
                          className={`block text-[10px] ${
                            usernameStatus === "taken" || usernameStatus === "invalid"
                              ? "font-medium text-red-600"
                              : usernameStatus === "available"
                                ? "font-medium text-[#10b981]"
                                : "text-[#786a57]"
                          }`}
                          aria-live="polite"
                        >
                          {usernameStatus === "checking"
                            ? "Checking username availability…"
                            : usernameStatus === "available"
                              ? "✓ Username is available"
                              : usernameStatus === "taken"
                                ? "Already taken — please pick another username"
                                : usernameStatus === "error"
                                  ? "Couldn't verify right now; we'll check on submit."
                                  : usernameStatus === "invalid"
                                    ? "Must be 3–32 lowercase letters, numbers, or underscores"
                                    : "Letters, numbers, and underscores allowed"}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-[#231d17]">
                          <Mail size={13} className="text-[#d75e2e]" />
                          Email address
                        </label>
                        <input
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          type="email"
                          autoComplete="email"
                          required
                          maxLength={254}
                          className="min-h-10 w-full rounded-xl border border-[#e2d5c3] bg-white px-3.5 text-xs text-[#231d17] shadow-xs outline-none transition placeholder:text-[#948471] hover:border-[#cfbfa9] focus:border-[#d75e2e] focus:ring-3 focus:ring-[#d75e2e]/10 sm:text-sm"
                          placeholder="you@example.com"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-[#231d17]">
                          <LockKeyhole size={13} className="text-[#d75e2e]" />
                          Password
                        </label>
                        <input
                          name="password"
                          type="password"
                          autoComplete="new-password"
                          required
                          minLength={8}
                          maxLength={128}
                          className="min-h-10 w-full rounded-xl border border-[#e2d5c3] bg-white px-3.5 text-xs text-[#231d17] shadow-xs outline-none transition placeholder:text-[#948471] hover:border-[#cfbfa9] focus:border-[#d75e2e] focus:ring-3 focus:ring-[#d75e2e]/10 sm:text-sm"
                          placeholder="Minimum 8 characters"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="flex items-center justify-between text-xs font-semibold text-[#231d17]">
                          <span className="flex items-center gap-1.5">
                            <Phone size={13} className="text-[#d75e2e]" />
                            Phone number
                          </span>
                          <span className="font-normal text-[#786a57]">Optional</span>
                        </label>
                        <input
                          value={phone}
                          onChange={(event) => setPhone(event.target.value)}
                          type="tel"
                          autoComplete="tel"
                          maxLength={30}
                          className="min-h-10 w-full rounded-xl border border-[#e2d5c3] bg-white px-3.5 text-xs text-[#231d17] shadow-xs outline-none transition placeholder:text-[#948471] hover:border-[#cfbfa9] focus:border-[#d75e2e] focus:ring-3 focus:ring-[#d75e2e]/10 sm:text-sm"
                          placeholder="+212 …"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={
                          isSubmittingAuth ||
                          usernameStatus === "checking" ||
                          usernameStatus === "idle" ||
                          usernameStatus === "invalid" ||
                          usernameStatus === "taken"
                        }
                        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-xs font-semibold text-[#faf5ee] shadow-sm transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55"
                        style={{ background: "linear-gradient(135deg, #d75e2e, #c24f24)" }}
                      >
                        {isSubmittingAuth ? (
                          <LoaderCircle size={15} className="animate-spin" />
                        ) : (
                          <UserPlus size={15} />
                        )}
                        {isSubmittingAuth ? "Creating account…" : "Create Account"}
                      </button>

                      <p className="pt-1 text-center text-xs text-[#786a57]">
                        Already registered?{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode("login");
                            setAuthError("");
                          }}
                          className="font-semibold text-[#d75e2e] underline-offset-2 hover:underline"
                        >
                          Sign in here
                        </button>
                      </p>
                    </form>
                  )}
                  <p className="mb-0 mt-5 text-center text-[10px] leading-relaxed text-[#948471]">
                    By continuing, you agree to keep your credentials safe and avoid sharing
                    sensitive data with the AI assistant.
                  </p>
                </div>
              )}
            </section>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}