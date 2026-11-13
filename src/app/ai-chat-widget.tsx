"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AtSign, Bot, Check, History, ImagePlus, LoaderCircle, LockKeyhole, LogIn, LogOut, Mail, MessageCircle, MessageSquarePlus, Phone, Send, ShieldCheck, Trash2, UserRound, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
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
type AuthMode = "login" | "create";
type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid" | "error";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isChatMessageArray(value: unknown): value is ChatMessage[] {
  return Array.isArray(value) && value.every(isChatMessage);
}

function isAccount(value: unknown): value is Account {
  return isRecord(value)
    && typeof value.id === "number"
    && typeof value.full_name === "string"
    && typeof value.username === "string"
    && typeof value.email === "string"
    && typeof value.phone === "string"
    && typeof value.role === "string"
    && (typeof value.avatar_image === "string" || value.avatar_image === null);
}

function isConversation(value: unknown): value is Conversation {
  return isRecord(value)
    && typeof value.id === "string"
    && typeof value.title === "string"
    && typeof value.created_at === "string"
    && typeof value.updated_at === "string";
}

function isChatMessage(value: unknown): value is ChatMessage {
  return isRecord(value)
    && typeof value.id === "number"
    && (value.role === "user" || value.role === "assistant")
    && typeof value.content === "string"
    && Array.isArray(value.sources)
    && value.sources.every((source) => isRecord(source)
      && typeof source.title === "string"
      && typeof source.url === "string"
      && /^https?:\/\//.test(source.url))
    && typeof value.created_at === "string";
}

function errorMessage(payload: unknown, fallback: string) {
  if (!isRecord(payload)) return fallback;
  if (typeof payload.detail === "string") return payload.detail;
  if (Array.isArray(payload.detail)) {
    const messages = payload.detail
      .map((item) => isRecord(item) && typeof item.msg === "string" ? item.msg : "")
      .filter(Boolean);
    if (messages.length) return messages.slice(0, 2).join(" ");
  }
  return fallback;
}

async function requestJson(url: string, init?: RequestInit) {
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
  return value.trim().normalize("NFKD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "").slice(0, 32);
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function Avatar({ account, size = 38 }: { account: Account; size?: number }) {
  return (
    <span className="grid shrink-0 place-items-center overflow-hidden rounded-full bg-neutral-100 text-neutral-500 ring-1 ring-neutral-200" style={{ width: size, height: size }}>
      {account.avatar_image
        ? <ProjectImage src={account.avatar_image} alt={`${account.full_name}'s profile`} className="size-full object-cover" sizes={`${size}px`} />
        : <UserRound size={size * 0.48} aria-hidden="true" />}
    </span>
  );
}

export default function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"agent" | "account">("agent");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [account, setAccount] = useState<Account | null>(null);
  const [isCheckingAccount, setIsCheckingAccount] = useState(true);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<Conversation[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [usernameCheck, setUsernameCheck] = useState<{ username: string; status: "available" | "taken" | "error" } | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const validUsername = /^[a-z0-9_]{3,32}$/.test(username);
  const usernameStatus: UsernameStatus = !username
    ? "idle"
    : !validUsername
      ? "invalid"
      : usernameCheck?.username === username
        ? usernameCheck.status
        : "checking";

  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const payload = await requestJson("/api/account/conversations");
      if (!Array.isArray(payload) || !payload.every(isConversation)) throw new Error("Chat history returned an invalid response.");
      setHistory(payload);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chat history could not be loaded.");
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void requestJson("/api/account/session")
      .then((payload) => {
        if (!isRecord(payload) || !isAccount(payload.account)) throw new Error("Account details returned an invalid response.");
        if (!active) return;
        setAccount(payload.account);
        void loadHistory();
      })
      .catch((error: unknown) => {
        const status = isRecord(error) && typeof error.status === "number" ? error.status : 0;
        if (active && status !== 401) toast.error(error instanceof Error ? error.message : "Account service is unavailable.");
      })
      .finally(() => {
        if (active) setIsCheckingAccount(false);
      });
    return () => { active = false; };
  }, [loadHistory]);

  useEffect(() => {
    if (authMode !== "create" || !validUsername) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetch(`/api/account/username-availability?username=${encodeURIComponent(username)}`, {
        cache: "no-store",
        signal: controller.signal,
      }).then(async (response) => {
        const payload: unknown = await response.json();
        if (!response.ok || !isRecord(payload) || typeof payload.available !== "boolean") {
          throw new Error(errorMessage(payload, "Username availability could not be checked."));
        }
        setUsernameCheck({ username, status: payload.available ? "available" : "taken" });
      }).catch((error: unknown) => {
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

  const acceptAccount = (payload: unknown) => {
    if (!isRecord(payload) || !isAccount(payload.account)) throw new Error("Account details returned an invalid response.");
    setAccount(payload.account);
    setActiveTab("agent");
    setAuthMode("login");
    setMessages([]);
    setConversationId(null);
    setHistoryOpen(false);
    void loadHistory();
  };

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setIsSubmittingAuth(true);
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
      toast.success("You are signed in. Your AI chat is ready.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign-in failed.");
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
    try {
      const payload = await requestJson("/api/account/register", { method: "POST", body: data });
      acceptAccount(payload);
      setAvatarFile(null);
      setAvatarPreview(null);
      toast.success("Your account is ready. You can now chat with Ahmed's AI assistant.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Account creation failed.");
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
      setMessages([]);
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
    setHistoryOpen(false);
    setActiveTab("agent");
  };

  const openConversation = async (conversation: Conversation) => {
    setIsLoadingConversation(true);
    try {
      const payload = await requestJson(`/api/account/conversations/${conversation.id}`);
      if (!isRecord(payload) || !Array.isArray(payload.messages) || !payload.messages.every(isChatMessage)) {
        throw new Error("This conversation returned an invalid response.");
      }
      setConversationId(conversation.id);
      setMessages(payload.messages);
      setHistoryOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The conversation could not be opened.");
    } finally {
      setIsLoadingConversation(false);
    }
  };

  const removeConversation = async (conversation: Conversation) => {
    try {
      await requestJson(`/api/account/conversations/${conversation.id}`, { method: "DELETE" });
      setHistory((current) => current.filter((item) => item.id !== conversation.id));
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
      void loadHistory();
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
          className="fixed bottom-5 right-5 z-40 grid size-14 place-items-center rounded-full bg-emerald-600 text-white shadow-[0_12px_35px_rgba(5,150,105,.28)] transition hover:-translate-y-1 hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600 sm:bottom-7 sm:right-7"
          aria-label="Open AI assistant and account"
        >
          <MessageCircle size={23} strokeWidth={1.8} aria-hidden="true" />
          <span className="absolute right-0 top-0 size-3 rounded-full border-2 border-white bg-emerald-500" aria-hidden="true" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-neutral-950/45 backdrop-blur-[3px] transition-opacity data-[state=closed]:opacity-0" />
        <Dialog.Content className="fixed inset-0 z-50 flex h-[100dvh] w-full flex-col overflow-hidden bg-[#faf9f6] text-neutral-800 shadow-2xl transition duration-200 data-[state=closed]:scale-[.98] data-[state=closed]:opacity-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-[min(760px,88dvh)] sm:w-[min(780px,calc(100vw-32px))] sm:max-h-[88dvh] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:border-neutral-200">
          <header className="flex items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"><Bot size={21} aria-hidden="true" /></span>
              <div className="min-w-0">
                <Dialog.Title className="truncate text-sm font-semibold tracking-tight text-neutral-900">Ahmed&apos;s corner</Dialog.Title>
                <Dialog.Description className="mt-0.5 truncate text-xs text-neutral-500">Ask, explore, and get to know my work.</Dialog.Description>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeTab === "agent" && account && (
                <button type="button" onClick={() => { setHistoryOpen((value) => !value); void loadHistory(); }} className={`grid size-9 place-items-center rounded-lg border transition ${historyOpen ? "border-neutral-300 bg-neutral-100 text-neutral-900" : "border-transparent text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"}`} aria-label={historyOpen ? "Hide chat history" : "Show chat history"} aria-pressed={historyOpen}>
                  <History size={17} aria-hidden="true" />
                </button>
              )}
              <Dialog.Close asChild><button type="button" className="grid size-9 place-items-center rounded-lg text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900" aria-label="Close assistant"><X size={19} /></button></Dialog.Close>
            </div>
          </header>

          <div className="grid grid-cols-2 border-b border-neutral-200 bg-white px-4 sm:px-6" role="tablist" aria-label="Assistant tabs">
            <button type="button" role="tab" id="assistant-tab" aria-controls="assistant-panel" aria-selected={activeTab === "agent"} onClick={() => setActiveTab("agent")} className={`relative inline-flex min-h-12 items-center justify-center gap-2 text-sm font-medium transition ${activeTab === "agent" ? "text-neutral-900" : "text-neutral-500 hover:text-neutral-800"}`}>
              <Bot size={16} aria-hidden="true" /> AI Agent
              {account && <span className="size-1.5 rounded-full bg-emerald-500" aria-label="Signed in" />}
              {activeTab === "agent" && <span className="absolute inset-x-5 bottom-0 h-0.5 rounded-full bg-neutral-900" />}
            </button>
            <button type="button" role="tab" id="account-tab" aria-controls="account-panel" aria-selected={activeTab === "account"} onClick={() => setActiveTab("account")} className={`relative inline-flex min-h-12 items-center justify-center gap-2 text-sm font-medium transition ${activeTab === "account" ? "text-neutral-900" : "text-neutral-500 hover:text-neutral-800"}`}>
              <UserRound size={16} aria-hidden="true" /> My Account
              {activeTab === "account" && <span className="absolute inset-x-5 bottom-0 h-0.5 rounded-full bg-neutral-900" />}
            </button>
          </div>

          {activeTab === "agent" ? (
            <section id="assistant-panel" role="tabpanel" aria-labelledby="assistant-tab" className="relative flex min-h-0 flex-1 flex-col">
              {!account ? (
                <div className="grid flex-1 place-items-center p-7 text-center sm:p-12">
                  <div className="max-w-sm">
                    <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"><LockKeyhole size={23} /></span>
                    <h2 className="mb-2 mt-5 text-lg font-semibold tracking-tight">Sign in to start chatting</h2>
                    <p className="mb-5 text-sm leading-relaxed text-neutral-500">Your conversations are saved to your account. Sign in or create a free account to use Ahmed&apos;s AI assistant.</p>
                    <button type="button" onClick={() => { setAuthMode("login"); setActiveTab("account"); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"><LogIn size={16} /> Go to My Account</button>
                    <p className="mb-0 mt-4 text-xs text-neutral-400">Ahmed&apos;s assistant can also search the web and share sources.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3 border-b border-neutral-200/80 bg-white/70 px-4 py-3 sm:px-6">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar account={account} size={32} />
                      <div className="min-w-0"><p className="m-0 truncate text-xs font-medium text-neutral-800">Chatting as {account.full_name}</p><p className="m-0 mt-0.5 text-[10px] text-neutral-500">Your chat is private to your account</p></div>
                    </div>
                    <button type="button" onClick={startNewChat} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100 sm:px-3"><MessageSquarePlus size={14} /> New chat</button>
                  </div>

                  {historyOpen && (
                    <aside className="absolute inset-0 z-10 flex flex-col border-b border-neutral-200 bg-white shadow-lg" aria-label="Chat history">
                      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
                        <div className="flex items-center gap-2"><History size={16} /><h2 className="m-0 text-sm font-semibold">Your history</h2></div>
                        <button type="button" onClick={() => setHistoryOpen(false)} className="grid size-8 place-items-center rounded-lg text-neutral-500 hover:bg-neutral-100" aria-label="Close history"><X size={17} /></button>
                      </div>
                      <div className="min-h-0 flex-1 overflow-y-auto p-2">
                        {isLoadingHistory ? <p className="p-5 text-center text-sm text-neutral-500">Loading conversations…</p> : history.length === 0 ? <p className="p-5 text-center text-sm leading-relaxed text-neutral-500">Your saved conversations will appear here after your first message.</p> : history.map((conversation) => (
                          <div key={conversation.id} className={`group flex items-center gap-1 rounded-xl p-1 transition ${conversation.id === conversationId ? "bg-neutral-100" : "hover:bg-neutral-50"}`}>
                            <button type="button" onClick={() => void openConversation(conversation)} className="min-w-0 flex-1 rounded-lg px-3 py-2.5 text-left" disabled={isLoadingConversation}>
                              <span className="block truncate text-sm font-medium text-neutral-800">{conversation.title}</span>
                              <time className="mt-1 block text-[10px] text-neutral-400" dateTime={conversation.updated_at}>{formatDate(conversation.updated_at)}</time>
                            </button>
                            <button type="button" onClick={() => void removeConversation(conversation)} className="grid size-8 shrink-0 place-items-center rounded-lg text-neutral-400 opacity-100 transition hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100" aria-label={`Delete ${conversation.title}`}><Trash2 size={14} /></button>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-neutral-200 px-4 py-2.5 text-center text-[10px] text-neutral-400">Only you can see your conversations.</div>
                    </aside>
                  )}

                  <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
                    {messages.length === 0 ? (
                      <div className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center py-8 text-center">
                        <span className="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"><Bot size={21} /></span>
                        <h2 className="mb-2 mt-4 text-base font-semibold">Hi, {account.full_name.split(/\s+/)[0]}.</h2>
                        <p className="mb-0 text-sm leading-relaxed text-neutral-500">I&apos;m Ahmed&apos;s AI assistant. Ask about his studies, projects, or skills—or ask me something else. I can search the web and include sources.</p>
                        <div className="mt-5 flex flex-wrap justify-center gap-2">
                          {["Tell me about Ahmed's projects", "What is Ahmed studying?", "Explain vector databases"].map((suggestion) => <button key={suggestion} type="button" onClick={() => setDraftMessage(suggestion)} className="rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-900">{suggestion}</button>)}
                        </div>
                      </div>
                    ) : (
                      <div className="mx-auto max-w-2xl space-y-5">
                        {messages.map((message) => (
                          <div key={message.id} className={`flex gap-2.5 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                            {message.role === "assistant" && <span className="mt-1 grid size-7 shrink-0 place-items-center rounded-lg bg-neutral-900 text-white"><Bot size={15} /></span>}
                            <div className={`max-w-[88%] rounded-2xl px-3.5 py-3 sm:px-4 ${message.role === "user" ? "rounded-br-md bg-neutral-900 text-white" : "rounded-bl-md border border-neutral-200 bg-white text-neutral-800 shadow-sm"}`}>
                              <p className="m-0 whitespace-pre-wrap break-words text-sm leading-[1.65]">{message.content}</p>
                              {message.sources.length > 0 && <div className="mt-3 border-t border-neutral-200 pt-2.5"><p className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400"><Check size={12} /> Web sources</p><div className="flex flex-wrap gap-1.5">{message.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="max-w-full truncate rounded-full bg-neutral-100 px-2.5 py-1.5 text-[10px] text-neutral-600 transition hover:bg-neutral-200 hover:text-neutral-900">{source.title}</a>)}</div></div>}
                            </div>
                            {message.role === "user" && <Avatar account={account} size={28} />}
                          </div>
                        ))}
                        {isSending && <div className="flex items-center gap-2 text-xs text-neutral-500"><LoaderCircle size={15} className="animate-spin" /> Searching and thinking…</div>}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                    {isLoadingConversation && <div className="absolute inset-0 grid place-items-center bg-white/70"><LoaderCircle size={24} className="animate-spin text-neutral-500" /></div>}
                  </div>

                  <form onSubmit={sendMessage} className="border-t border-neutral-200 bg-white px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 sm:px-5 sm:pb-4">
                    <div className="mx-auto flex max-w-2xl items-end gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-2 transition focus-within:border-neutral-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-neutral-900/5">
                      <textarea value={draftMessage} onChange={(event) => setDraftMessage(event.target.value)} onKeyDown={handleComposerKeyDown} maxLength={2000} rows={1} placeholder="Ask Ahmed's assistant anything…" aria-label="Your message" className="max-h-28 min-h-10 flex-1 resize-y bg-transparent px-2 py-2 text-sm leading-relaxed text-neutral-800 outline-none placeholder:text-neutral-400" disabled={isSending} />
                      <button type="submit" disabled={!draftMessage.trim() || isSending} className="grid size-10 shrink-0 place-items-center rounded-xl bg-neutral-900 text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-35" aria-label="Send message">{isSending ? <LoaderCircle size={17} className="animate-spin" /> : <Send size={17} />}</button>
                    </div>
                    <p className="mx-auto mb-0 mt-2 max-w-2xl text-center text-[10px] leading-relaxed text-neutral-400">AI can make mistakes. Don&apos;t share passwords or sensitive information.</p>
                  </form>
                </>
              )}
            </section>
          ) : (
            <section id="account-panel" role="tabpanel" aria-labelledby="account-tab" className="min-h-0 flex-1 overflow-y-auto">
              {isCheckingAccount ? (
                <div className="grid min-h-full place-items-center text-sm text-neutral-500"><span className="flex items-center gap-2"><LoaderCircle size={17} className="animate-spin" /> Checking your account…</span></div>
              ) : account ? (
                <div className="mx-auto max-w-lg p-5 sm:p-8">
                  <div className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
                    <Avatar account={account} size={60} />
                    <div className="min-w-0 flex-1"><span className="font-[var(--font-mono)] text-[9px] uppercase tracking-wider text-neutral-400">YOUR ACCOUNT</span><h2 className="mb-0 mt-1 truncate text-base font-semibold">{account.full_name}</h2><p className="mb-0 mt-0.5 truncate text-xs text-neutral-500">@{account.username}</p></div>
                  </div>
                  <dl className="my-5 divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white px-4">
                    <div className="flex justify-between gap-3 py-3"><dt className="text-xs text-neutral-500">Email</dt><dd className="m-0 break-all text-right text-xs text-neutral-800">{account.email}</dd></div>
                    <div className="flex justify-between gap-3 py-3"><dt className="text-xs text-neutral-500">Phone</dt><dd className="m-0 text-right text-xs text-neutral-800">{account.phone || "Not provided"}</dd></div>
                    <div className="flex justify-between gap-3 py-3"><dt className="text-xs text-neutral-500">Role</dt><dd className="m-0 text-right text-xs capitalize text-neutral-800">{account.role}</dd></div>
                  </dl>
                  <div className="mb-5 flex items-start gap-2 rounded-xl bg-neutral-100 p-3 text-xs leading-relaxed text-neutral-600"><ShieldCheck size={15} className="mt-0.5 shrink-0" />Your sign-in is protected by a secure, HTTP-only session. Your chats are private to your account.</div>
                  <button type="button" onClick={() => void signOut()} disabled={isLoggingOut} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-60"><LogOut size={15} />{isLoggingOut ? "Signing out…" : "Sign out"}</button>
                </div>
              ) : (
                <div className="mx-auto max-w-lg p-5 sm:p-8">
                  <div className="mb-5 grid grid-cols-2 rounded-xl border border-neutral-200 bg-neutral-100/70 p-1" role="group" aria-label="Account action">
                    <button type="button" onClick={() => setAuthMode("login")} className={`rounded-lg py-2.5 text-xs font-semibold transition ${authMode === "login" ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100" : "text-neutral-500 hover:text-neutral-800"}`}>Sign in</button>
                    <button type="button" onClick={() => { setAuthMode("create"); setUsernameTouched(false); setUsernameCheck(null); setUsername(makeUsername(fullName)); }} className={`rounded-lg py-2.5 text-xs font-semibold transition ${authMode === "create" ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100" : "text-neutral-500 hover:text-neutral-800"}`}>Create account</button>
                  </div>

                  {authMode === "login" ? (
                    <form className="space-y-4" onSubmit={submitLogin}>
                      <label className="block space-y-2 text-xs font-semibold text-neutral-700"><span className="flex items-center gap-2"><AtSign size={14} className="text-emerald-700" />Username or email</span><input name="username" type="text" autoComplete="username" required maxLength={254} className="min-h-12 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm shadow-sm outline-none transition placeholder:text-neutral-400 hover:border-neutral-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" placeholder="you@example.com" /></label>
                      <label className="block space-y-2 text-xs font-semibold text-neutral-700"><span className="flex items-center gap-2"><LockKeyhole size={14} className="text-emerald-700" />Password</span><input name="password" type="password" autoComplete="current-password" required maxLength={128} className="min-h-12 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm shadow-sm outline-none transition placeholder:text-neutral-400 hover:border-neutral-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" placeholder="Your password" /></label>
                      <button type="submit" disabled={isSubmittingAuth} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100 disabled:opacity-60">{isSubmittingAuth ? <LoaderCircle size={16} className="animate-spin" /> : <LogIn size={16} />}{isSubmittingAuth ? "Signing in…" : "Sign in securely"}</button>
                    </form>
                  ) : (
                    <form className="space-y-3.5" onSubmit={submitRegistration}>
                        <label className="block space-y-1.5 text-xs font-semibold text-neutral-700"><span className="flex items-center gap-2"><UserRound size={14} className="text-emerald-700" />Full name</span><input value={fullName} onChange={(event) => { setFullName(event.target.value); if (!usernameTouched) { setUsername(makeUsername(event.target.value)); setUsernameCheck(null); } }} autoComplete="name" required minLength={2} maxLength={100} className="min-h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm shadow-sm outline-none transition placeholder:text-neutral-400 hover:border-neutral-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" placeholder="Your full name" /></label>
                        <label className="block space-y-1.5 text-xs font-semibold text-neutral-700"><span className="flex items-center gap-2"><AtSign size={14} className="text-emerald-700" />Username</span><div className="relative"><input value={username} onChange={(event) => { setUsernameTouched(true); setUsernameCheck(null); setUsername(event.target.value.toLowerCase().replace(/\s+/g, "_")); }} autoComplete="username" required minLength={3} maxLength={32} pattern="[a-z0-9_]{3,32}" className="min-h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 pr-10 text-sm shadow-sm outline-none transition placeholder:text-neutral-400 hover:border-neutral-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" placeholder="your_username" />{usernameStatus === "checking" && <LoaderCircle size={15} className="absolute right-3 top-3 animate-spin text-neutral-400" />}{usernameStatus === "available" && <Check size={15} className="absolute right-3 top-3 text-emerald-600" />}</div><span className={`block text-[10px] font-normal ${usernameStatus === "taken" || usernameStatus === "invalid" ? "text-red-600" : usernameStatus === "available" || usernameStatus === "error" ? "text-emerald-700" : "text-neutral-400"}`} aria-live="polite">{usernameStatus === "checking" ? "Checking availability…" : usernameStatus === "available" ? "Username is available" : usernameStatus === "taken" ? "Already taken—try another username" : usernameStatus === "error" ? "Couldn’t check right now. You can still create your account; we’ll verify during sign-up." : usernameStatus === "invalid" ? "Use 3–32 lowercase letters, numbers, or underscores" : "Suggested from your full name; you can edit it."}</span></label>
                      <label className="block space-y-1.5 text-xs font-semibold text-neutral-700"><span className="flex items-center gap-2"><Mail size={14} className="text-emerald-700" />Email</span><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required maxLength={254} className="min-h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm shadow-sm outline-none transition placeholder:text-neutral-400 hover:border-neutral-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" placeholder="you@example.com" /></label>
                      <label className="block space-y-1.5 text-xs font-semibold text-neutral-700"><span className="flex items-center gap-2"><LockKeyhole size={14} className="text-emerald-700" />Password</span><input name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} className="min-h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm shadow-sm outline-none transition placeholder:text-neutral-400 hover:border-neutral-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" placeholder="At least 8 characters" /></label>
                      <label className="block space-y-1.5 text-xs font-semibold text-neutral-700"><span className="flex items-center gap-2"><Phone size={14} className="text-emerald-700" />Phone <span className="font-normal text-neutral-400">· optional</span></span><input value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" autoComplete="tel" maxLength={30} className="min-h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm shadow-sm outline-none transition placeholder:text-neutral-400 hover:border-neutral-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" placeholder="+212 …" /></label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-white px-3 text-xs text-neutral-600 transition hover:border-neutral-500">
                          <ImagePlus size={14} className="shrink-0 text-emerald-700" /><span className="min-w-0 truncate">{avatarFile?.name ?? "Add profile image"}</span><input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { chooseAvatar(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} />
                        </label>
                        <div className="flex min-h-10 items-center justify-between rounded-xl border border-neutral-200 bg-neutral-100 px-3 text-xs text-neutral-600"><span>Role</span><span className="font-medium text-neutral-800">User</span></div>
                      </div>
                      <p className="m-0 text-[10px] leading-relaxed text-neutral-400">New accounts start with the standard user role. Elevated access is managed privately.</p>
                      {avatarPreview && <div className="flex items-center gap-2 text-xs text-neutral-500"><span className="size-8 overflow-hidden rounded-full"><ProjectImage src={avatarPreview} alt="Profile image preview" className="size-full object-cover" sizes="32px" /></span>{avatarFile?.name}</div>}
                      <button type="submit" disabled={isSubmittingAuth || usernameStatus === "checking" || usernameStatus === "idle" || usernameStatus === "invalid" || usernameStatus === "taken"} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-55">{isSubmittingAuth ? <LoaderCircle size={16} className="animate-spin" /> : <UserRound size={16} />}{isSubmittingAuth ? "Creating account…" : "Create account"}</button>
                    </form>
                  )}
                  <p className="mb-0 mt-4 text-center text-[10px] leading-relaxed text-neutral-400">By continuing, you agree not to share passwords or sensitive personal information in AI chats.</p>
                </div>
              )}
            </section>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
