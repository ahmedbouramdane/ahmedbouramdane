"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Award,
  Bot,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  ImagePlus,
  Link2,
  LoaderCircle,
  LogOut,
  Mail,
  MailOpen,
  MessageSquare,
  MessageSquareText,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import ProjectImage from "../project-image";

type AdminSession = { username: string };
type AdminMessage = {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  is_read: boolean;
};
type AdminMessagePage = { items: AdminMessage[]; total: number; limit: number; offset: number };
type AdminChatAccount = { id: number; full_name: string; username: string; email: string };
type AdminChatSummary = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  account: AdminChatAccount;
  last_message: string;
  message_count: number;
};
type AdminChatPage = { items: AdminChatSummary[]; total: number; limit: number; offset: number };
type AdminChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  sources: { title: string; url: string }[];
  created_at: string;
};
type AdminChatDetail = Omit<AdminChatSummary, "last_message" | "message_count"> & { messages: AdminChatMessage[] };

type DirectInboxAccount = {
  id: number;
  full_name: string;
  username: string;
  email: string;
  avatar_image: string | null;
};
type DirectInboxItem = {
  account: DirectInboxAccount;
  updated_at: string;
  last_message: string;
  last_sender_role: "user" | "admin" | "";
  message_count: number;
  unread_count: number;
};
type DirectInboxPage = {
  items: DirectInboxItem[];
  total: number;
  unread_total: number;
  limit: number;
  offset: number;
};
type DirectThreadMessage = {
  id: number;
  sender_role: "user" | "admin";
  content: string;
  is_read: boolean;
  created_at: string;
};
type DirectThreadDetail = {
  account: DirectInboxAccount;
  admin: { full_name: string; image: string };
  thread: {
    updated_at: string;
    messages: DirectThreadMessage[];
  };
};
type MessageFilter = "all" | "unread" | "read";
type ManagedProject = {
  id: number;
  sort_order: number;
  title: string;
  category: string;
  description: string;
  stack: string[];
  repo: string;
  image: string;
};
type ProjectDraft = Omit<ManagedProject, "id" | "sort_order" | "stack"> & { stack: string };
type ProjectImageMode = "upload" | "url";
type ManagedCertificate = {
  id: number;
  sort_order: number;
  title: string;
  field: string;
  earned: string;
  credential_id: string;
  issuer: string;
  verified_url: string;
  image: string;
};
type CertificateDraft = Omit<ManagedCertificate, "id" | "sort_order">;

const pageSize = 50;
const chatPageSize = 30;

function emptyProjectDraft(): ProjectDraft {
  return {
    title: "",
    category: "",
    description: "",
    stack: "",
    repo: "",
    image: "",
  };
}

function emptyCertificateDraft(): CertificateDraft {
  return {
    title: "",
    field: "",
    earned: "",
    credential_id: "",
    issuer: "",
    verified_url: "",
    image: "",
  };
}

class DashboardRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAdminSession(value: unknown): value is AdminSession {
  return isRecord(value) && typeof value.username === "string";
}

function isAdminMessage(value: unknown): value is AdminMessage {
  return isRecord(value)
    && typeof value.id === "number"
    && typeof value.name === "string"
    && typeof value.email === "string"
    && typeof value.subject === "string"
    && typeof value.message === "string"
    && typeof value.created_at === "string"
    && typeof value.is_read === "boolean";
}

function isAdminMessagePage(value: unknown): value is AdminMessagePage {
  return isRecord(value)
    && Array.isArray(value.items)
    && value.items.every(isAdminMessage)
    && typeof value.total === "number"
    && typeof value.limit === "number"
    && typeof value.offset === "number";
}

function isAdminChatAccount(value: unknown): value is AdminChatAccount {
  return isRecord(value)
    && typeof value.id === "number"
    && typeof value.full_name === "string"
    && typeof value.username === "string"
    && typeof value.email === "string";
}

function isAdminChatSummary(value: unknown): value is AdminChatSummary {
  return isRecord(value)
    && typeof value.id === "string"
    && typeof value.title === "string"
    && typeof value.created_at === "string"
    && typeof value.updated_at === "string"
    && isAdminChatAccount(value.account)
    && typeof value.last_message === "string"
    && typeof value.message_count === "number";
}

function isAdminChatPage(value: unknown): value is AdminChatPage {
  return isRecord(value)
    && Array.isArray(value.items)
    && value.items.every(isAdminChatSummary)
    && typeof value.total === "number"
    && typeof value.limit === "number"
    && typeof value.offset === "number";
}

function isAdminChatMessage(value: unknown): value is AdminChatMessage {
  return isRecord(value)
    && typeof value.id === "number"
    && (value.role === "user" || value.role === "assistant")
    && typeof value.content === "string"
    && Array.isArray(value.sources)
    && value.sources.every((source) => isRecord(source) && typeof source.title === "string" && typeof source.url === "string")
    && typeof value.created_at === "string";
}

function isAdminChatDetail(value: unknown): value is AdminChatDetail {
  return isRecord(value)
    && typeof value.id === "string"
    && typeof value.title === "string"
    && typeof value.created_at === "string"
    && typeof value.updated_at === "string"
    && isAdminChatAccount(value.account)
    && Array.isArray(value.messages)
    && value.messages.every(isAdminChatMessage);
}

function isDirectInboxPage(value: unknown): value is DirectInboxPage {
  return isRecord(value) && Array.isArray(value.items) && typeof value.total === "number";
}

function isDirectThreadDetail(value: unknown): value is DirectThreadDetail {
  return isRecord(value) && isRecord(value.account) && isRecord(value.thread) && Array.isArray(value.thread.messages);
}

function isManagedProject(value: unknown): value is ManagedProject {
  if (typeof value !== "object" || value === null) return false;
  return "id" in value
    && typeof value.id === "number"
    && Number.isInteger(value.id)
    && "sort_order" in value
    && typeof value.sort_order === "number"
    && Number.isInteger(value.sort_order)
    && "title" in value
    && typeof value.title === "string"
    && "category" in value
    && typeof value.category === "string"
    && "description" in value
    && typeof value.description === "string"
    && "stack" in value
    && Array.isArray(value.stack)
    && value.stack.every((item) => typeof item === "string")
    && "repo" in value
    && typeof value.repo === "string"
    && "image" in value
    && typeof value.image === "string";
}

function isManagedProjectList(value: unknown): value is ManagedProject[] {
  return Array.isArray(value) && value.every(isManagedProject);
}

function parseManagedCertificate(value: unknown): ManagedCertificate | null {
  if (!isRecord(value)
    || typeof value.id !== "number"
    || !Number.isInteger(value.id)
    || typeof value.sort_order !== "number"
    || !Number.isInteger(value.sort_order)
    || typeof value.title !== "string"
    || typeof value.field !== "string"
    || typeof value.earned !== "string"
    || typeof value.credential_id !== "string"
    || typeof value.image !== "string"
    || ("issuer" in value && typeof value.issuer !== "string")
    || ("verified_url" in value && typeof value.verified_url !== "string")) {
    return null;
  }
  return {
    id: value.id,
    sort_order: value.sort_order,
    title: value.title,
    field: value.field,
    earned: value.earned,
    credential_id: value.credential_id,
    issuer: typeof value.issuer === "string" ? value.issuer : "HackerRank",
    verified_url: typeof value.verified_url === "string" ? value.verified_url : "",
    image: value.image,
  };
}

function parseManagedCertificateList(value: unknown): ManagedCertificate[] | null {
  if (!Array.isArray(value)) return null;
  const certificates = value.map(parseManagedCertificate);
  return certificates.some((certificate) => certificate === null)
    ? null
    : certificates.filter((certificate): certificate is ManagedCertificate => certificate !== null);
}

function isUploadedImage(value: unknown): value is { image: string } {
  return isRecord(value)
    && typeof value.image === "string"
    && /^\/api\/portfolio-images\/[A-Za-z0-9_-]{24,48}$/.test(value.image);
}

async function dashboardRequest(url: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(url, { ...init, cache: "no-store" });
  let payload: unknown = null;
  if (response.status !== 204) {
    try {
      payload = await response.json();
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
    }
  }
  if (!response.ok) {
    const detail = isRecord(payload) && typeof payload.detail === "string" ? payload.detail : "";
    throw new DashboardRequestError(detail || "The dashboard request could not be completed.", response.status);
  }
  return payload;
}

function messageDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString();
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString([], { dateStyle: "medium" });
}

export default function DashboardClient() {
  const [username, setUsername] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingChatDetail, setIsLoadingChatDetail] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isLoadingCertificates, setIsLoadingCertificates] = useState(false);
  const [isSavingCertificate, setIsSavingCertificate] = useState(false);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [chats, setChats] = useState<AdminChatSummary[]>([]);
  const [selectedChat, setSelectedChat] = useState<AdminChatDetail | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [projects, setProjects] = useState<ManagedProject[]>([]);
  const [certificates, setCertificates] = useState<ManagedCertificate[]>([]);
  const [activeView, setActiveView] = useState<"messages" | "projects" | "certificates" | "chats" | "profile">("messages");
  const [projectDraft, setProjectDraft] = useState<ProjectDraft>(emptyProjectDraft);
  const [certificateDraft, setCertificateDraft] = useState<CertificateDraft>(emptyCertificateDraft);
  const [projectImageMode, setProjectImageMode] = useState<ProjectImageMode>("upload");
  const [projectImageFile, setProjectImageFile] = useState<File | null>(null);
  const [projectImagePreview, setProjectImagePreview] = useState<string | null>(null);
  const [certificateImageMode, setCertificateImageMode] = useState<ProjectImageMode>("upload");
  const [certificateImageFile, setCertificateImageFile] = useState<File | null>(null);
  const [certificateImagePreview, setCertificateImagePreview] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [editingCertificateId, setEditingCertificateId] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [filter, setFilter] = useState<MessageFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
  const [chatTotal, setChatTotal] = useState(0);
  const [chatOffset, setChatOffset] = useState(0);
  const [chatMode, setChatMode] = useState<"direct" | "ai">("direct");
  const [directInbox, setDirectInbox] = useState<DirectInboxItem[]>([]);
  const [directInboxTotal, setDirectInboxTotal] = useState(0);
  const [directInboxUnread, setDirectInboxUnread] = useState(0);
  const [isLoadingDirectInbox, setIsLoadingDirectInbox] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [selectedDirectThread, setSelectedDirectThread] = useState<DirectThreadDetail | null>(null);
  const [isLoadingDirectThread, setIsLoadingDirectThread] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [directSearch, setDirectSearch] = useState("");
  const directThreadEndRef = useRef<HTMLDivElement>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  // Profile management state
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileAvatarFile, setProfileAvatarFile] = useState<File | null>(null);
  const [profileAvatarPreview, setProfileAvatarPreview] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const profileFileRef = useRef<HTMLInputElement>(null);

  const loadMessages = useCallback(async (nextOffset: number) => {
    setIsLoadingMessages(true);
    setError("");
    try {
      const payload = await dashboardRequest(`/api/dashboard/messages?limit=${pageSize}&offset=${nextOffset}`);
      if (!isAdminMessagePage(payload)) throw new Error("The dashboard returned an invalid message list.");
      setMessages(payload.items);
      setTotal(payload.total);
      setOffset(nextOffset);
      return true;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Messages could not be loaded.");
      if (requestError instanceof DashboardRequestError && requestError.status === 401) {
        setIsAuthenticated(false);
      }
      return false;
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  const loadChats = useCallback(async (nextOffset: number) => {
    setIsLoadingChats(true);
    setError("");
    try {
      const payload = await dashboardRequest(`/api/dashboard/chats?limit=${chatPageSize}&offset=${nextOffset}`);
      if (!isAdminChatPage(payload)) throw new Error("The dashboard returned an invalid AI chat list.");
      setChats(payload.items);
      setChatTotal(payload.total);
      setChatOffset(nextOffset);
      setSelectedChat((current) => current && payload.items.some((chat) => chat.id === current.id) ? current : null);
      setSelectedChatId((current) => current && payload.items.some((chat) => chat.id === current) ? current : null);
      return true;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "AI chats could not be loaded.");
      if (requestError instanceof DashboardRequestError && requestError.status === 401) setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoadingChats(false);
    }
  }, []);

  const loadChatDetail = useCallback(async (conversationId: string) => {
    setIsLoadingChatDetail(true);
    setSelectedChatId(conversationId);
    setSelectedChat(null);
    setError("");
    try {
      const payload = await dashboardRequest(`/api/dashboard/chats/${conversationId}`);
      if (!isAdminChatDetail(payload)) throw new Error("The dashboard returned an invalid AI chat.");
      setSelectedChat(payload);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The AI chat could not be loaded.");
      if (requestError instanceof DashboardRequestError && requestError.status === 401) setIsAuthenticated(false);
    } finally {
      setIsLoadingChatDetail(false);
    }
  }, []);

  const deleteChat = async (conversationId: string) => {
    if (!window.confirm("Permanently delete this AI conversation and its messages?")) return;
    setError("");
    setNotice("");
    try {
      await dashboardRequest(`/api/dashboard/chats/${conversationId}`, { method: "DELETE" });
      setSelectedChat(null);
      setSelectedChatId(null);
      const nextOffset = chats.length === 1 && chatOffset > 0 ? Math.max(0, chatOffset - chatPageSize) : chatOffset;
      await loadChats(nextOffset);
      setNotice("AI conversation deleted.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The AI conversation could not be deleted.");
      if (requestError instanceof DashboardRequestError && requestError.status === 401) setIsAuthenticated(false);
    }
  };

  const loadDirectInbox = useCallback(async (isPolling = false) => {
    if (!isPolling) setIsLoadingDirectInbox(true);
    try {
      const payload = await dashboardRequest("/api/dashboard/inbox?limit=50&offset=0");
      if (isDirectInboxPage(payload)) {
        setDirectInbox(payload.items);
        setDirectInboxTotal(payload.total);
        setDirectInboxUnread(payload.unread_total);
        setSelectedAccountId((current) => current ?? (payload.items.length > 0 ? payload.items[0].account.id : null));
      }
    } catch (requestError) {
      if (!isPolling) {
        setError(requestError instanceof Error ? requestError.message : "Direct inbox could not be loaded.");
        if (requestError instanceof DashboardRequestError && requestError.status === 401) setIsAuthenticated(false);
      }
    } finally {
      if (!isPolling) setIsLoadingDirectInbox(false);
    }
  }, []);

  const loadDirectThread = useCallback(async (accountId: number, isPolling = false) => {
    if (!isPolling) setIsLoadingDirectThread(true);
    try {
      const payload = await dashboardRequest(`/api/dashboard/inbox/${accountId}`);
      if (isDirectThreadDetail(payload)) {
        setSelectedDirectThread(payload);
        setDirectInbox((current) =>
          current.map((item) => (item.account.id === accountId ? { ...item, unread_count: 0 } : item))
        );
      }
    } catch (requestError) {
      if (!isPolling) {
        setError(requestError instanceof Error ? requestError.message : "Conversation could not be loaded.");
        if (requestError instanceof DashboardRequestError && requestError.status === 401) setIsAuthenticated(false);
      }
    } finally {
      if (!isPolling) setIsLoadingDirectThread(false);
    }
  }, []);

  const sendReply = async (event?: FormEvent) => {
    if (event) event.preventDefault();
    const text = replyText.trim();
    if (!text || !selectedAccountId || isSendingReply) return;
    setReplyText("");
    setIsSendingReply(true);

    const optimisticMsg: DirectThreadMessage = {
      id: Date.now(),
      sender_role: "admin",
      content: text,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setSelectedDirectThread((current) =>
      current
        ? {
            ...current,
            thread: {
              ...current.thread,
              messages: [...current.thread.messages, optimisticMsg],
            },
          }
        : null
    );

    try {
      await dashboardRequest(`/api/dashboard/inbox/${selectedAccountId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      void loadDirectThread(selectedAccountId, true);
      void loadDirectInbox(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Reply could not be sent.");
      setReplyText(text);
      if (requestError instanceof DashboardRequestError && requestError.status === 401) setIsAuthenticated(false);
    } finally {
      setIsSendingReply(false);
    }
  };

  const loadProjects = useCallback(async () => {
    setIsLoadingProjects(true);
    setError("");
    try {
      const payload = await dashboardRequest("/api/dashboard/projects");
      if (!isManagedProjectList(payload)) throw new Error("The dashboard returned an invalid project list.");
      setProjects(payload);
      return true;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Projects could not be loaded.");
      if (requestError instanceof DashboardRequestError && requestError.status === 401) {
        setIsAuthenticated(false);
      }
      return false;
    } finally {
      setIsLoadingProjects(false);
    }
  }, []);

  const loadCertificates = useCallback(async () => {
    setIsLoadingCertificates(true);
    setError("");
    try {
      const payload = await dashboardRequest("/api/dashboard/certificates");
      const parsedCertificates = parseManagedCertificateList(payload);
      if (!parsedCertificates) throw new Error("The dashboard returned an invalid certificate list.");
      setCertificates(parsedCertificates);
      return true;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Certificates could not be loaded.");
      if (requestError instanceof DashboardRequestError && requestError.status === 401) {
        setIsAuthenticated(false);
      }
      return false;
    } finally {
      setIsLoadingCertificates(false);
    }
  }, []);

  const chooseProjectImage = (file: File | undefined) => {
    if (!file) return;
    const supportedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!supportedTypes.includes(file.type)) {
      setError("Choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Images must be 5 MB or smaller.");
      return;
    }
    setError("");
    setProjectImageFile(file);
    setProjectImagePreview(URL.createObjectURL(file));
  };

  const chooseCertificateImage = (file: File | undefined) => {
    if (!file) return;
    const supportedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!supportedTypes.includes(file.type)) {
      setError("Choose a JPEG, PNG, or WebP certificate image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Images must be 5 MB or smaller.");
      return;
    }
    setError("");
    setCertificateImageFile(file);
    setCertificateImagePreview(URL.createObjectURL(file));
  };

  useEffect(() => {
    if (!projectImagePreview) return;
    return () => URL.revokeObjectURL(projectImagePreview);
  }, [projectImagePreview]);

  useEffect(() => {
    if (!certificateImagePreview) return;
    return () => URL.revokeObjectURL(certificateImagePreview);
  }, [certificateImagePreview]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const payload = await dashboardRequest("/api/dashboard/session");
        if (!isAdminSession(payload)) throw new Error("The dashboard returned an invalid session.");
        if (!active) return;
        setUsername(payload.username);
        setIsAuthenticated(true);
        await Promise.all([loadMessages(0), loadProjects(), loadCertificates(), loadChats(0), loadDirectInbox(false), loadProfile()]);
      } catch (requestError) {
        if (!active) return;
        setIsAuthenticated(false);
        if (!(requestError instanceof DashboardRequestError && requestError.status === 401)) {
          setError(requestError instanceof Error ? requestError.message : "The dashboard could not be reached.");
        }
      } finally {
        if (active) setIsCheckingSession(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [loadCertificates, loadChats, loadDirectInbox, loadMessages, loadProjects]);

  // Real-time polling for WhatsApp-style direct messaging
  useEffect(() => {
    if (!isAuthenticated || activeView !== "chats") return;
    if (chatMode === "direct") {
      void loadDirectInbox(true);
      const timer = setInterval(() => {
        void loadDirectInbox(true);
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [isAuthenticated, activeView, chatMode, loadDirectInbox]);

  useEffect(() => {
    if (!isAuthenticated || activeView !== "chats" || chatMode !== "direct" || !selectedAccountId) return;
    void loadDirectThread(selectedAccountId, false);
    const timer = setInterval(() => {
      void loadDirectThread(selectedAccountId, true);
    }, 2500);
    return () => clearInterval(timer);
  }, [isAuthenticated, activeView, chatMode, selectedAccountId, loadDirectThread]);

  useEffect(() => {
    directThreadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedDirectThread?.thread.messages, isSendingReply]);

  const unreadCount = useMemo(() => messages.filter((message) => !message.is_read).length, [messages]);
  const visibleMessages = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return messages.filter((message) => {
      if (filter === "unread" && message.is_read) return false;
      if (filter === "read" && !message.is_read) return false;
      if (!query) return true;
      return [message.name, message.email, message.subject, message.message]
        .some((value) => value.toLocaleLowerCase().includes(query));
    });
  }, [filter, messages, search]);
  const selectedMessage = visibleMessages.find((message) => message.id === selectedMessageId)
    ?? visibleMessages[0]
    ?? null;

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setNotice("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      const payload = await dashboardRequest("/api/dashboard/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: String(formData.get("username") ?? ""),
          password: String(formData.get("password") ?? ""),
        }),
      });
      if (!isAdminSession(payload)) throw new Error("The dashboard returned an invalid session.");
      setUsername(payload.username);
      setIsAuthenticated(true);
      form.reset();
      await Promise.all([loadMessages(0), loadProjects(), loadCertificates()]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Sign-in failed.");
      if (!(requestError instanceof DashboardRequestError && requestError.status === 401)) {
        setIsAuthenticated(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setError("");
    try {
      await dashboardRequest("/api/dashboard/logout", { method: "POST" });
      setIsAuthenticated(false);
      setMessages([]);
      setChats([]);
      setSelectedChat(null);
      setSelectedChatId(null);
      setChatTotal(0);
      setChatOffset(0);
      setProjects([]);
      setCertificates([]);
      setTotal(0);
      setUsername("");
      setActiveView("messages");
      setEditingProjectId(null);
      setEditingCertificateId(null);
      setProjectDraft(emptyProjectDraft());
      setCertificateDraft(emptyCertificateDraft());
      setCertificateImageFile(null);
      setCertificateImagePreview(null);
      setCertificateImageMode("upload");
      setProjectImageFile(null);
      setProjectImagePreview(null);
      setNotice("You have been signed out.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Sign-out failed.");
      if (requestError instanceof DashboardRequestError && requestError.status === 401) {
        setIsAuthenticated(false);
        setMessages([]);
        setProjects([]);
        setCertificates([]);
        setUsername("");
      }
    }
  };

  const toggleRead = async (message: AdminMessage) => {
    setError("");
    setNotice("");
    try {
      await dashboardRequest(`/api/dashboard/messages/${message.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_read: !message.is_read }),
      });
      setMessages((current) => current.map((item) => item.id === message.id ? { ...item, is_read: !message.is_read } : item));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The message status could not be updated.");
      if (requestError instanceof DashboardRequestError && requestError.status === 401) setIsAuthenticated(false);
    }
  };

  const deleteMessage = async (message: AdminMessage) => {
    if (!window.confirm(`Permanently delete the message “${message.subject}” from ${message.name}?`)) return;
    setError("");
    setNotice("");
    try {
      await dashboardRequest(`/api/dashboard/messages/${message.id}`, { method: "DELETE" });
      const nextOffset = messages.length === 1 && offset > 0 ? Math.max(0, offset - pageSize) : offset;
      await loadMessages(nextOffset);
      setNotice("Message deleted.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The message could not be deleted.");
      if (requestError instanceof DashboardRequestError && requestError.status === 401) setIsAuthenticated(false);
    }
  };

  const saveProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSavingProject(true);
    try {
      let image = projectDraft.image;
      if (projectImageMode === "upload" && projectImageFile) {
        const upload = new FormData();
        upload.append("image", projectImageFile);
        const uploadResult = await dashboardRequest("/api/dashboard/project-images", {
          method: "POST",
          body: upload,
        });
        if (!isUploadedImage(uploadResult)) throw new Error("The dashboard returned an invalid uploaded image.");
        image = uploadResult.image;
      }
      const payload = {
        ...projectDraft,
        image,
        stack: projectDraft.stack.split(",").map((item) => item.trim()).filter(Boolean),
      };
      const result = await dashboardRequest(
        editingProjectId === null
          ? "/api/dashboard/projects"
          : `/api/dashboard/projects/${editingProjectId}`,
        {
          method: editingProjectId === null ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!isManagedProject(result)) throw new Error("The dashboard returned an invalid project.");
      setProjects((current) => editingProjectId === null
        ? [...current, result]
        : current.map((project) => project.id === result.id ? result : project));
      setProjectDraft(emptyProjectDraft());
      setProjectImageFile(null);
      setProjectImagePreview(null);
      setProjectImageMode("upload");
      setEditingProjectId(null);
      setNotice(editingProjectId === null ? "Project added to your portfolio." : "Project changes saved.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The project could not be saved.");
      if (requestError instanceof DashboardRequestError && requestError.status === 401) setIsAuthenticated(false);
    } finally {
      setIsSavingProject(false);
    }
  };

  const editProject = (project: ManagedProject) => {
    setEditingProjectId(project.id);
    setProjectDraft({
      title: project.title,
      category: project.category,
      description: project.description,
      stack: project.stack.join(", "),
      repo: project.repo,
      image: project.image,
    });
    setProjectImageMode(project.image.startsWith("https://") ? "url" : "upload");
    setProjectImageFile(null);
    setProjectImagePreview(null);
    setError("");
    setNotice("");
  };

  const cancelProjectEdit = () => {
    setEditingProjectId(null);
    setProjectDraft(emptyProjectDraft());
    setProjectImageMode("upload");
    setProjectImageFile(null);
    setProjectImagePreview(null);
  };

  const deleteProject = async (project: ManagedProject) => {
    if (!window.confirm(`Permanently remove “${project.title}” from the portfolio?`)) return;
    setError("");
    setNotice("");
    try {
      await dashboardRequest(`/api/dashboard/projects/${project.id}`, { method: "DELETE" });
      setProjects((current) => current.filter((item) => item.id !== project.id));
      if (editingProjectId === project.id) cancelProjectEdit();
      setNotice("Project removed from your portfolio.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The project could not be deleted.");
      if (requestError instanceof DashboardRequestError && requestError.status === 401) setIsAuthenticated(false);
    }
  };

  const moveProject = async (projectIndex: number, direction: -1 | 1) => {
    const destination = projectIndex + direction;
    if (destination < 0 || destination >= projects.length) return;
    const reordered = [...projects];
    [reordered[projectIndex], reordered[destination]] = [reordered[destination], reordered[projectIndex]];
    setError("");
    setNotice("");
    setIsSavingProject(true);
    try {
      const payload = await dashboardRequest("/api/dashboard/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: reordered.map((project) => project.id) }),
      });
      if (!isManagedProjectList(payload)) throw new Error("The dashboard returned an invalid project order.");
      setProjects(payload);
      setNotice("Project order updated.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Projects could not be reordered.");
      if (requestError instanceof DashboardRequestError && requestError.status === 401) setIsAuthenticated(false);
    } finally {
      setIsSavingProject(false);
    }
  };

  const saveCertificate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSavingCertificate(true);
    try {
      let image = certificateDraft.image;
      if (certificateImageMode === "upload" && certificateImageFile) {
        const upload = new FormData();
        upload.append("image", certificateImageFile);
        const uploadResult = await dashboardRequest("/api/dashboard/certificate-images", {
          method: "POST",
          body: upload,
        });
        if (!isUploadedImage(uploadResult)) {
          throw new Error("The dashboard returned an invalid certificate image.");
        }
        image = uploadResult.image;
      }
      const result = await dashboardRequest(
        editingCertificateId === null
          ? "/api/dashboard/certificates"
          : `/api/dashboard/certificates/${editingCertificateId}`,
        {
          method: editingCertificateId === null ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...certificateDraft, image }),
        },
      );
      const parsedCertificate = parseManagedCertificate(result);
      if (!parsedCertificate) throw new Error("The dashboard returned an invalid certificate.");
      setCertificates((current) => editingCertificateId === null
        ? [...current, parsedCertificate]
        : current.map((certificate) => certificate.id === parsedCertificate.id ? parsedCertificate : certificate));
      setCertificateDraft(emptyCertificateDraft());
      setCertificateImageFile(null);
      setCertificateImagePreview(null);
      setCertificateImageMode("upload");
      setEditingCertificateId(null);
      setNotice(editingCertificateId === null ? "Certificate added to your portfolio." : "Certificate changes saved.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The certificate could not be saved.");
      if (requestError instanceof DashboardRequestError && requestError.status === 401) setIsAuthenticated(false);
    } finally {
      setIsSavingCertificate(false);
    }
  };

  const editCertificate = (certificate: ManagedCertificate) => {
    setEditingCertificateId(certificate.id);
    setCertificateDraft({
      title: certificate.title,
      field: certificate.field,
      earned: certificate.earned,
      credential_id: certificate.credential_id,
      issuer: certificate.issuer,
      verified_url: certificate.verified_url,
      image: certificate.image,
    });
    setCertificateImageMode(certificate.image.startsWith("https://") ? "url" : "upload");
    setCertificateImageFile(null);
    setCertificateImagePreview(null);
    setError("");
    setNotice("");
  };

  const cancelCertificateEdit = () => {
    setEditingCertificateId(null);
    setCertificateDraft(emptyCertificateDraft());
    setCertificateImageMode("upload");
    setCertificateImageFile(null);
    setCertificateImagePreview(null);
  };

  const deleteCertificate = async (certificate: ManagedCertificate) => {
    if (!window.confirm(`Permanently remove “${certificate.title}” from the portfolio?`)) return;
    setError("");
    setNotice("");
    try {
      await dashboardRequest(`/api/dashboard/certificates/${certificate.id}`, { method: "DELETE" });
      setCertificates((current) => current.filter((item) => item.id !== certificate.id));
      if (editingCertificateId === certificate.id) cancelCertificateEdit();
      setNotice("Certificate removed from your portfolio.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The certificate could not be deleted.");
      if (requestError instanceof DashboardRequestError && requestError.status === 401) setIsAuthenticated(false);
    }
  };

  const moveCertificate = async (certificateIndex: number, direction: -1 | 1) => {
    const destination = certificateIndex + direction;
    if (destination < 0 || destination >= certificates.length) return;
    const reordered = [...certificates];
    [reordered[certificateIndex], reordered[destination]] = [reordered[destination], reordered[certificateIndex]];
    setError("");
    setNotice("");
    setIsSavingCertificate(true);
    try {
      const payload = await dashboardRequest("/api/dashboard/certificates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: reordered.map((certificate) => certificate.id) }),
      });
      const parsedCertificates = parseManagedCertificateList(payload);
      if (!parsedCertificates) throw new Error("The dashboard returned an invalid certificate order.");
      setCertificates(parsedCertificates);
      setNotice("Certificate order updated.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Certificates could not be reordered.");
      if (requestError instanceof DashboardRequestError && requestError.status === 401) setIsAuthenticated(false);
    } finally {
      setIsSavingCertificate(false);
    }
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSavingProfile(true);
    try {
      const data = new FormData();
      data.set("full_name", profileName.trim());
      if (profileEmail.trim()) data.set("email", profileEmail.trim());
      if (profilePhone.trim()) data.set("phone", profilePhone.trim());
      if (profileAvatarFile) data.set("image", profileAvatarFile);
      const response = await fetch("/api/dashboard/profile", {
        method: "PATCH",
        body: data,
        cache: "no-store",
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const detail = isRecord(payload) && typeof payload.detail === "string" ? payload.detail : "";
        throw new DashboardRequestError(detail || "Profile could not be updated.", response.status);
      }
      setProfileAvatarFile(null);
      setProfileAvatarPreview(null);
      if (profileFileRef.current) profileFileRef.current.value = "";
      setNotice("Your profile has been updated.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Profile could not be updated.");
      if (requestError instanceof DashboardRequestError && requestError.status === 401) setIsAuthenticated(false);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const chooseProfileAvatar = (file: File | undefined) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Profile images must be 5 MB or smaller.");
      return;
    }
    setError("");
    setProfileAvatarFile(file);
    setProfileAvatarPreview(URL.createObjectURL(file));
  };

  const loadProfile = useCallback(async () => {
    try {
      const response = await fetch("/api/dashboard/profile", {
        method: "GET",
        cache: "no-store",
      });
      if (!response.ok) return;
      const payload: unknown = await response.json();
      if (isRecord(payload) && isRecord(payload.account)) {
        const acc = payload.account;
        if (typeof acc.full_name === "string") setProfileName(acc.full_name);
        if (typeof acc.email === "string") setProfileEmail(acc.email);
        if (typeof acc.phone === "string") setProfilePhone(acc.phone);
      }
    } catch {
      // Profile loading is non-critical — the admin may not have a user account
    }
  }, []);

  useEffect(() => {
    if (!profileAvatarPreview) return;
    return () => URL.revokeObjectURL(profileAvatarPreview);
  }, [profileAvatarPreview]);

  if (isCheckingSession) {
    return <main className="dashboard-page"><div className="dashboard-loading">Checking private session…</div></main>;
  }

  if (!isAuthenticated) {
    return (
      <main className="dashboard-page">
        <section className="dashboard-login">
          <Link className="dashboard-home-link" href="/"><ArrowLeft size={15} /> Portfolio</Link>
          <div className="dashboard-login-mark"><ShieldCheck size={24} /></div>
          <p className="dashboard-eyebrow">PRIVATE AREA / AUTHORIZED ACCESS</p>
          <h1>Welcome back.</h1>
          <p className="dashboard-login-copy">Sign in to manage messages, featured projects, and certificates.</p>
          {error && <p className="dashboard-alert dashboard-alert-error" role="alert">{error}</p>}
          {notice && <p className="dashboard-alert dashboard-alert-success" role="status">{notice}</p>}
          <form className="dashboard-login-form" onSubmit={handleLogin}>
            <label htmlFor="admin-username">Username</label>
            <input id="admin-username" name="username" type="text" autoComplete="username" maxLength={64} required />
            <label htmlFor="admin-password">Password</label>
            <input id="admin-password" name="password" type="password" autoComplete="current-password" maxLength={256} required />
            <button type="submit" disabled={isSubmitting}>
              <ShieldCheck size={16} />{isSubmitting ? "Signing in…" : "Sign in securely"}
            </button>
          </form>
          <p className="dashboard-security-note">Your session is private, secure, and expires automatically.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <div className="dashboard-shell">
        <header className="dashboard-header">
          <Link className="dashboard-home-link" href="/">
            <ArrowLeft size={15} className="text-[#d75e2e]" /> Portfolio
          </Link>
          <button className="dashboard-logout" type="button" onClick={handleLogout}>
            <LogOut size={15} className="text-[#d75e2e]" /> Sign out
          </button>
        </header>

        <section className="dashboard-heading">
          <p className="dashboard-eyebrow">PRIVATE DASHBOARD / {username}</p>
          <h1>
            {activeView === "messages"
              ? "Messages"
              : activeView === "projects"
                ? "Projects"
                : activeView === "certificates"
                  ? "Certificates"
                  : "User Chats"}
            <span>.</span>
          </h1>
          <p>
            {activeView === "messages"
              ? "Review and manage contact messages sent through your portfolio."
              : activeView === "projects"
                ? "Edit the projects shown on your public portfolio."
                : activeView === "certificates"
                  ? "Add, update, and arrange the credentials shown on your public portfolio."
                  : "Chat live with registered users in real time and review AI conversation logs."}
          </p>
        </section>

        <nav className="dashboard-view-switch" aria-label="Dashboard sections">
          <button
            type="button"
            className={activeView === "messages" ? "selected" : ""}
            onClick={() => {
              setActiveView("messages");
              setError("");
              setNotice("");
            }}
            aria-pressed={activeView === "messages"}
          >
            <Mail size={16} className={activeView === "messages" ? "text-[#d75e2e]" : "text-[#a1552a]"} /> Messages <span>{total}</span>
          </button>
          <button
            type="button"
            className={activeView === "projects" ? "selected" : ""}
            onClick={() => {
              setActiveView("projects");
              setError("");
              setNotice("");
            }}
            aria-pressed={activeView === "projects"}
          >
            <FolderKanban size={16} className={activeView === "projects" ? "text-[#d75e2e]" : "text-[#a1552a]"} /> Projects <span>{projects.length}</span>
          </button>
          <button
            type="button"
            className={activeView === "certificates" ? "selected" : ""}
            onClick={() => {
              setActiveView("certificates");
              setError("");
              setNotice("");
            }}
            aria-pressed={activeView === "certificates"}
          >
            <Award size={16} className={activeView === "certificates" ? "text-[#d75e2e]" : "text-[#a1552a]"} /> Certificates <span>{certificates.length}</span>
          </button>
          <button
            type="button"
            className={activeView === "chats" ? "selected" : ""}
            onClick={() => {
              setActiveView("chats");
              setError("");
              setNotice("");
            }}
            aria-pressed={activeView === "chats"}
          >
            <MessageSquare size={16} className={activeView === "chats" ? "text-[#d75e2e]" : "text-[#a1552a]"} /> Live Chats{" "}
            <span>{directInboxUnread > 0 ? directInboxUnread : directInboxTotal}</span>
          </button>
          <button
            type="button"
            className={activeView === "profile" ? "selected" : ""}
            onClick={() => {
              setActiveView("profile");
              setError("");
              setNotice("");
            }}
            aria-pressed={activeView === "profile"}
          >
            <UserRound size={16} className={activeView === "profile" ? "text-[#d75e2e]" : "text-[#a1552a]"} /> Profile
          </button>
        </nav>

        {activeView === "messages" && (
          <section className="dashboard-summary" aria-label="Message summary">
            <div><span>Total messages</span><strong>{total}</strong></div>
            <div><span>Unread on this page</span><strong>{unreadCount}</strong></div>
            <div><span>Showing</span><strong>{total ? `${offset + 1}–${Math.min(offset + messages.length, total)}` : "0"}</strong></div>
          </section>
        )}

        {error && <p className="dashboard-alert dashboard-alert-error" role="alert">{error}</p>}
        {notice && <p className="dashboard-alert dashboard-alert-success" role="status">{notice}</p>}

        {activeView === "chats" ? (
          <section className="space-y-4" aria-label="User communication & chats">
            {/* Chats Sub-Nav: Live WhatsApp Chat vs AI Assistant Logs */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ece2d5] pb-3">
              <div className="flex items-center gap-2 rounded-2xl border border-[#e4d8c7] bg-[#f0e6d6]/70 p-1">
                <button
                  type="button"
                  onClick={() => setChatMode("direct")}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                    chatMode === "direct"
                      ? "bg-white text-[#231d17] shadow-xs"
                      : "text-[#786a57] hover:text-[#231d17]"
                  }`}
                >
                  <MessageSquare size={14} className="text-[#d75e2e]" />
                  Live User Chats (WhatsApp Style)
                  {directInboxUnread > 0 && (
                    <span className="rounded-full bg-[#d75e2e] px-1.5 py-0.2 font-[var(--font-mono)] text-[10px] font-bold text-white">
                      {directInboxUnread}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setChatMode("ai");
                    void loadChats(0);
                  }}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                    chatMode === "ai"
                      ? "bg-white text-[#231d17] shadow-xs"
                      : "text-[#786a57] hover:text-[#231d17]"
                  }`}
                >
                  <Bot size={14} className="text-[#a1552a]" />
                  AI Assistant Logs ({chatTotal})
                </button>
              </div>

              <button
                className="dashboard-refresh"
                type="button"
                onClick={() => {
                  if (chatMode === "direct") {
                    void loadDirectInbox(false);
                    if (selectedAccountId) void loadDirectThread(selectedAccountId, false);
                  } else {
                    void loadChats(chatOffset);
                  }
                }}
                disabled={isLoadingChats || isLoadingDirectInbox}
              >
                <RefreshCw
                  size={14}
                  className={`text-[#d75e2e] ${isLoadingChats || isLoadingDirectInbox ? "spinning" : ""}`}
                />{" "}
                Refresh
              </button>
            </div>

            {/* MODE 1: LIVE WHATSAPP-STYLE DIRECT CHAT */}
            {chatMode === "direct" ? (
              <div className="grid min-h-[560px] gap-4 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.15fr)]">
                {/* User Conversations List */}
                <aside className="flex max-h-[72vh] flex-col overflow-hidden rounded-2xl border border-[#e4d8c7] bg-[#fffdfa] shadow-xs">
                  {/* Search Bar */}
                  <div className="border-b border-[#ece2d5] p-3">
                    <div className="flex items-center gap-2 rounded-xl border border-[#e4d8c7] bg-[#fbf5e9] px-3 py-1.5">
                      <Search size={14} className="text-[#d75e2e]" />
                      <input
                        type="text"
                        value={directSearch}
                        onChange={(e) => setDirectSearch(e.target.value)}
                        placeholder="Search user name or handle…"
                        className="w-full bg-transparent text-xs text-[#231d17] outline-none placeholder:text-[#948471]"
                      />
                      {directSearch && (
                        <button
                          type="button"
                          onClick={() => setDirectSearch("")}
                          className="text-[#948471] hover:text-[#231d17]"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Conversations Scrollable List */}
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    {isLoadingDirectInbox && directInbox.length === 0 ? (
                      <div className="p-8 text-center text-xs text-[#786a57]">
                        <LoaderCircle size={18} className="mx-auto mb-2 animate-spin text-[#d75e2e]" />
                        Loading conversations…
                      </div>
                    ) : directInbox.length === 0 ? (
                      <div className="p-8 text-center text-xs text-[#786a57]">
                        <MessageSquare size={24} className="mx-auto mb-2 text-[#d75e2e]/60" />
                        <strong>No direct user messages yet.</strong>
                        <p className="mt-1 text-[11px]">
                          When visitors message you from their account, their chats will appear here in real time.
                        </p>
                      </div>
                    ) : (
                      directInbox
                        .filter((item) => {
                          if (!directSearch.trim()) return true;
                          const q = directSearch.toLowerCase();
                          return (
                            item.account.full_name.toLowerCase().includes(q) ||
                            item.account.username.toLowerCase().includes(q) ||
                            item.last_message.toLowerCase().includes(q)
                          );
                        })
                        .map((item) => {
                          const isSelected = selectedAccountId === item.account.id;
                          return (
                            <button
                              key={item.account.id}
                              type="button"
                              onClick={() => void loadDirectThread(item.account.id, false)}
                              aria-pressed={isSelected}
                              className={`flex w-full items-start gap-3 border-b border-[#f0e6d6] p-3.5 text-left transition ${
                                isSelected ? "bg-[#f5ecdd] border-l-4 border-l-[#d75e2e]" : "hover:bg-[#faf4e8]"
                              }`}
                            >
                              <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full border border-[#e2d5c3] bg-[#fbf5e9] text-[#786a57]">
                                {item.account.avatar_image ? (
                                  <ProjectImage
                                    src={item.account.avatar_image}
                                    alt={item.account.full_name}
                                    className="size-full object-cover"
                                    sizes="40px"
                                  />
                                ) : (
                                  <UserRound size={20} />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <strong className="truncate text-xs font-semibold text-[#231d17]">
                                    {item.account.full_name}
                                  </strong>
                                  <time
                                    className="shrink-0 font-[var(--font-mono)] text-[9px] text-[#948471]"
                                    dateTime={item.updated_at}
                                  >
                                    {formatDate(item.updated_at)}
                                  </time>
                                </div>
                                <p className="m-0 truncate font-[var(--font-mono)] text-[10px] text-[#a1552a]">
                                  @{item.account.username}
                                </p>
                                <p className="mt-1 line-clamp-1 text-xs text-[#786a57]">
                                  {item.last_sender_role === "admin" && (
                                    <span className="font-semibold text-[#231d17]">You: </span>
                                  )}
                                  {item.last_message || "No messages yet"}
                                </p>
                              </div>
                              {item.unread_count > 0 && (
                                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#d75e2e] text-[10px] font-bold text-white shadow-xs">
                                  {item.unread_count}
                                </span>
                              )}
                            </button>
                          );
                        })
                    )}
                  </div>
                </aside>

                {/* WhatsApp Chat Canvas */}
                <article className="flex max-h-[72vh] flex-col overflow-hidden rounded-2xl border border-[#e4d8c7] bg-[#fffdfa] shadow-xs">
                  {isLoadingDirectThread && !selectedDirectThread ? (
                    <div className="grid flex-1 place-items-center text-xs text-[#786a57]">
                      <span className="flex items-center gap-2">
                        <LoaderCircle size={18} className="animate-spin text-[#d75e2e]" /> Loading
                        conversation…
                      </span>
                    </div>
                  ) : selectedDirectThread ? (
                    <>
                      {/* Chat Header */}
                      <header className="flex items-center justify-between border-b border-[#ece2d5] bg-[#fffdfa] px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full border border-[#e2d5c3] bg-[#fbf5e9]">
                            {selectedDirectThread.account.avatar_image ? (
                              <ProjectImage
                                src={selectedDirectThread.account.avatar_image}
                                alt={selectedDirectThread.account.full_name}
                                className="size-full object-cover"
                                sizes="40px"
                              />
                            ) : (
                              <UserRound size={20} className="text-[#786a57]" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="m-0 text-sm font-bold text-[#231d17]">
                                {selectedDirectThread.account.full_name}
                              </h3>
                              <span className="rounded-full bg-[#e8f5e9] px-2 py-0.5 text-[9px] font-semibold text-[#1e7e34]">
                                Live Chat
                              </span>
                            </div>
                            <p className="m-0 font-[var(--font-mono)] text-[10px] text-[#786a57]">
                              @{selectedDirectThread.account.username} · {selectedDirectThread.account.email}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedAccountId) void loadDirectThread(selectedAccountId, false);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#e2d5c3] bg-white px-2.5 py-1 text-xs text-[#2b241b] shadow-xs transition hover:bg-[#fbf5e9]"
                        >
                          <RefreshCw size={12} className="text-[#d75e2e]" /> Sync
                        </button>
                      </header>

                      {/* WhatsApp Messages Stream */}
                      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#faf7f2] p-4">
                        {selectedDirectThread.thread.messages.length === 0 ? (
                          <div className="grid h-full place-items-center text-center text-xs text-[#786a57]">
                            <p>No messages in this conversation yet. Send the first message below!</p>
                          </div>
                        ) : (
                          selectedDirectThread.thread.messages.map((msg) => {
                            const isAdmin = msg.sender_role === "admin";
                            return (
                              <div
                                key={msg.id}
                                className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                              >
                                <div
                                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed sm:text-sm ${
                                    isAdmin
                                      ? "rounded-tr-sm bg-[#d75e2e] text-[#faf6f0] shadow-sm"
                                      : "rounded-tl-sm border border-[#e8dfd3] bg-white text-[#2b241b] shadow-xs"
                                  }`}
                                >
                                  <div className="mb-1 flex items-center justify-between gap-3">
                                    <span
                                      className={`font-semibold ${
                                        isAdmin ? "text-[#e2a72e]" : "text-[#d75e2e]"
                                      }`}
                                    >
                                      {isAdmin ? "You (Ahmed)" : selectedDirectThread.account.full_name}
                                    </span>
                                  </div>
                                  <p className="m-0 whitespace-pre-wrap break-words">{msg.content}</p>
                                  <div
                                    className={`mt-1.5 flex items-center justify-end gap-1 font-[var(--font-mono)] text-[9px] ${
                                      isAdmin ? "text-neutral-400" : "text-[#948471]"
                                    }`}
                                  >
                                    <time dateTime={msg.created_at}>{formatDate(msg.created_at)}</time>
                                    {isAdmin && (
                                      <CheckCheck
                                        size={12}
                                        className={msg.is_read ? "text-[#34d399]" : "text-neutral-400"}
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                        <div ref={directThreadEndRef} />
                      </div>

                      {/* WhatsApp-style Input Composer */}
                      <form
                        onSubmit={sendReply}
                        className="border-t border-[#ece2d5] bg-[#fffdfa] p-3"
                      >
                        <div className="flex items-end gap-2 rounded-2xl border border-[#e4d8c7] bg-[#fbf5e9]/70 p-2 transition focus-within:border-[#d75e2e] focus-within:bg-white focus-within:ring-3 focus-within:ring-[#d75e2e]/10">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                void sendReply();
                              }
                            }}
                            rows={1}
                            placeholder={`Reply to ${selectedDirectThread.account.full_name}… (Press Enter to send)`}
                            className="max-h-28 min-h-10 flex-1 resize-y bg-transparent px-2.5 py-2 text-xs leading-relaxed text-[#231d17] outline-none placeholder:text-[#948471] sm:text-sm"
                            disabled={isSendingReply}
                          />
                          <button
                            type="submit"
                            disabled={!replyText.trim() || isSendingReply}
                            className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#d75e2e] text-[#faf5ee] shadow-xs transition hover:bg-[#c24f24] disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Send reply"
                          >
                            {isSendingReply ? (
                              <LoaderCircle size={16} className="animate-spin" />
                            ) : (
                              <Send size={15} />
                            )}
                          </button>
                        </div>
                      </form>
                    </>
                  ) : (
                    <div className="grid flex-1 place-items-center p-8 text-center text-xs text-[#786a57]">
                      <MessageSquare size={32} className="mx-auto mb-2 text-[#d75e2e]/60" />
                      <strong>Select a conversation on the left to start chatting in real time.</strong>
                    </div>
                  )}
                </article>
              </div>
            ) : (
              /* MODE 2: AI ASSISTANT CONVERSATION LOGS */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="dashboard-eyebrow">AI BOT CHAT ARCHIVE</p>
                    <h2 className="m-0 text-base font-semibold text-neutral-800">
                      {chatTotal} saved AI {chatTotal === 1 ? "conversation" : "conversations"}
                    </h2>
                  </div>
                </div>

                {isLoadingChats && chats.length === 0 ? (
                  <div className="dashboard-empty">Loading AI conversations…</div>
                ) : chats.length === 0 ? (
                  <div className="dashboard-empty">
                    <MessageSquareText size={23} className="text-[#d75e2e]" />
                    <strong>No saved AI conversations yet.</strong>
                    <span>Conversations appear here after users chat with the AI assistant.</span>
                  </div>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-[minmax(250px,.8fr)_minmax(0,1.2fr)]">
                    <aside
                      className="max-h-[70vh] overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-sm"
                      aria-label="Saved conversations"
                    >
                      {chats.map((chat) => (
                        <button
                          key={chat.id}
                          type="button"
                          onClick={() => void loadChatDetail(chat.id)}
                          aria-pressed={selectedChatId === chat.id}
                          className={`block w-full border-b border-neutral-100 p-4 text-left transition last:border-b-0 hover:bg-amber-50/60 ${
                            selectedChatId === chat.id ? "bg-amber-50" : "bg-white"
                          }`}
                        >
                          <span className="flex items-start justify-between gap-2">
                            <strong className="line-clamp-1 text-sm text-neutral-800">
                              {chat.title}
                            </strong>
                            <time
                              className="shrink-0 text-[10px] text-neutral-500"
                              dateTime={chat.updated_at}
                            >
                              {messageDate(chat.updated_at)}
                            </time>
                          </span>
                          <span className="mt-1 block text-xs text-neutral-600">
                            {chat.account.full_name}{" "}
                            <span className="text-neutral-400">@{chat.account.username}</span>
                          </span>
                          <span className="mt-2 block line-clamp-2 text-xs leading-relaxed text-neutral-500">
                            {chat.last_message || "No messages yet"}
                          </span>
                          <span className="mt-2 block font-[var(--font-mono)] text-[9px] uppercase tracking-wider text-neutral-400">
                            {chat.message_count} messages
                          </span>
                        </button>
                      ))}
                    </aside>
                    <article
                      className="flex max-h-[70vh] min-h-[360px] flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm"
                      aria-label="Conversation details"
                    >
                      {isLoadingChatDetail ? (
                        <div className="grid flex-1 place-items-center text-sm text-neutral-500">
                          Loading conversation…
                        </div>
                      ) : selectedChat ? (
                        <>
                          <header className="flex items-start justify-between gap-4 border-b border-neutral-200 p-4">
                            <div className="min-w-0">
                              <span className="font-[var(--font-mono)] text-[9px] uppercase tracking-wider text-neutral-400">
                                CHAT / @{selectedChat.account.username}
                              </span>
                              <h2 className="mb-1 mt-1 truncate text-base font-semibold text-neutral-800">
                                {selectedChat.title}
                              </h2>
                              <p className="m-0 truncate text-xs text-neutral-500">
                                {selectedChat.account.full_name} · {selectedChat.account.email}
                              </p>
                            </div>
                            <button
                              className="dashboard-delete inline-flex shrink-0 items-center gap-1"
                              type="button"
                              onClick={() => void deleteChat(selectedChat.id)}
                            >
                              <Trash2 size={14} className="text-red-500" /> Delete
                            </button>
                          </header>
                          <div className="flex-1 space-y-4 overflow-y-auto p-4">
                            {selectedChat.messages.map((message) => (
                              <div
                                key={message.id}
                                className={`flex ${
                                  message.role === "user" ? "justify-end" : "justify-start"
                                }`}
                              >
                                <div
                                  className={`max-w-[92%] rounded-2xl px-4 py-3 ${
                                    message.role === "user"
                                      ? "bg-neutral-800 text-white"
                                      : "bg-neutral-100 text-neutral-800"
                                  }`}
                                >
                                  <p className="m-0 whitespace-pre-wrap break-words text-sm leading-relaxed">
                                    {message.content}
                                  </p>
                                  {message.sources.length > 0 && (
                                    <div className="mt-3 border-t border-neutral-300/70 pt-2">
                                      <span className="font-[var(--font-mono)] text-[9px] uppercase tracking-wider text-neutral-500">
                                        Sources
                                      </span>
                                      <ul className="mb-0 mt-1 space-y-1 pl-4">
                                        {message.sources.map((source) => (
                                          <li key={source.url}>
                                            <a
                                              href={source.url}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="break-all text-xs text-amber-800 underline"
                                            >
                                              {source.title}
                                            </a>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  <time
                                    className={`mt-2 block text-right text-[9px] ${
                                      message.role === "user" ? "text-neutral-300" : "text-neutral-400"
                                    }`}
                                    dateTime={message.created_at}
                                  >
                                    {messageDate(message.created_at)}
                                  </time>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="grid flex-1 place-items-center p-8 text-center text-sm text-neutral-500">
                          Choose a saved conversation to review its messages.
                        </div>
                      )}
                    </article>
                  </div>
                )}
                {chatTotal > chatPageSize && (
                  <footer className="dashboard-pagination">
                    <span>
                      Page {Math.floor(chatOffset / chatPageSize) + 1} of{" "}
                      {Math.ceil(chatTotal / chatPageSize)}
                    </span>
                    <div>
                      <button
                        type="button"
                        onClick={() => void loadChats(Math.max(0, chatOffset - chatPageSize))}
                        disabled={chatOffset === 0 || isLoadingChats}
                      >
                        <ChevronLeft size={17} /> Previous
                      </button>
                      <button
                        type="button"
                        onClick={() => void loadChats(chatOffset + chatPageSize)}
                        disabled={chatOffset + chatPageSize >= chatTotal || isLoadingChats}
                      >
                        Next <ChevronRight size={17} />
                      </button>
                    </div>
                  </footer>
                )}
              </div>
            )}
          </section>
        ) : activeView === "messages" ? <section className="dashboard-inbox" aria-label="Contact messages">
          <div className="dashboard-inbox-toolbar">
            <label className="dashboard-search">
              <span className="sr-only">Search messages on this page</span>
              <Search size={16} className="text-[#d75e2e]" aria-hidden="true" />
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, subject, email…" />
              {search && <button type="button" className="dashboard-search-clear" onClick={() => setSearch("")} aria-label="Clear message search"><X size={14} /></button>}
            </label>
            <div className="dashboard-filter-group" role="group" aria-label="Filter messages">
              {(["all", "unread", "read"] as const).map((value) => (
                <button key={value} type="button" className={filter === value ? "selected" : ""} onClick={() => setFilter(value)} aria-pressed={filter === value}>
                  {value === "all" ? "All" : value === "unread" ? "Unread" : "Read"}
                  <span>{value === "all" ? messages.length : value === "unread" ? unreadCount : messages.length - unreadCount}</span>
                </button>
              ))}
            </div>
            <button className="dashboard-refresh" type="button" onClick={() => void loadMessages(offset)} disabled={isLoadingMessages} aria-label="Refresh messages">
              <RefreshCw size={16} className={isLoadingMessages ? "spinning" : ""} /> Refresh
            </button>
          </div>

          {isLoadingMessages && messages.length === 0 ? (
            <div className="dashboard-empty">Loading messages…</div>
          ) : visibleMessages.length === 0 ? (
            <div className="dashboard-empty">
              <Mail size={23} />
              <strong>{messages.length ? "No messages match this filter." : "Your inbox is clear."}</strong>
              <span>{messages.length ? "Try another search or filter." : "New contact form submissions will appear here."}</span>
            </div>
          ) : (
            <div className="dashboard-message-browser">
              <div className="dashboard-message-list" role="group" aria-label="Inbox messages">
                {visibleMessages.map((message) => (
                  <button
                    className={`dashboard-message-row${message.is_read ? " is-read" : " is-unread"}${selectedMessage?.id === message.id ? " is-selected" : ""}`}
                    key={message.id}
                    type="button"
                    aria-pressed={selectedMessage?.id === message.id}
                    onClick={() => setSelectedMessageId(message.id)}
                  >
                    <span className={`dashboard-message-row-status${message.is_read ? "" : " unread"}`} aria-label={message.is_read ? "Read" : "Unread"} />
                    <span className="dashboard-message-row-copy">
                      <span className="dashboard-message-row-meta"><strong>{message.name}</strong><time dateTime={message.created_at}>{messageDate(message.created_at)}</time></span>
                      <span className="dashboard-message-row-subject">{message.subject}</span>
                      <span className="dashboard-message-row-preview">{message.message.replace(/\s+/g, " ")}</span>
                    </span>
                  </button>
                ))}
              </div>
              {selectedMessage && (
                <article className="dashboard-message-detail" key={selectedMessage.id} aria-label={`Message from ${selectedMessage.name}`}>
                  <div className="dashboard-message-detail-top">
                    <span className={`dashboard-message-status${selectedMessage.is_read ? "" : " unread"}`}>{selectedMessage.is_read ? "READ MESSAGE" : "NEW MESSAGE"}</span>
                    <time dateTime={selectedMessage.created_at}>{messageDate(selectedMessage.created_at)}</time>
                  </div>
                  <h2>{selectedMessage.subject}</h2>
                  <div className="dashboard-message-detail-sender">
                    <span className="dashboard-message-avatar" aria-hidden="true">{selectedMessage.name.trim().charAt(0).toUpperCase()}</span>
                    <span><strong>{selectedMessage.name}</strong><a href={`mailto:${encodeURIComponent(selectedMessage.email)}`}>{selectedMessage.email}</a></span>
                  </div>
                  <p className="dashboard-message-detail-body">{selectedMessage.message}</p>
                  <div className="dashboard-message-actions">
                    <a className="dashboard-message-reply" href={`mailto:${encodeURIComponent(selectedMessage.email)}?subject=${encodeURIComponent(`Re: ${selectedMessage.subject}`)}`}>
                      <Mail size={14} /> Reply by email
                    </a>
                    <button type="button" onClick={() => void toggleRead(selectedMessage)}>
                      <MailOpen size={14} /> Mark as {selectedMessage.is_read ? "unread" : "read"}
                    </button>
                    <button className="dashboard-delete" type="button" onClick={() => void deleteMessage(selectedMessage)}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </article>
              )}
            </div>
          )}

          <footer className="dashboard-pagination">
            <span>{total ? `Page ${Math.floor(offset / pageSize) + 1} of ${Math.ceil(total / pageSize)}` : "No messages"}</span>
            <div>
              <button type="button" onClick={() => void loadMessages(Math.max(0, offset - pageSize))} disabled={offset === 0 || isLoadingMessages} aria-label="Previous page">
                <ChevronLeft size={17} /> Previous
              </button>
              <button type="button" onClick={() => void loadMessages(offset + pageSize)} disabled={offset + pageSize >= total || isLoadingMessages} aria-label="Next page">
                Next <ChevronRight size={17} />
              </button>
            </div>
          </footer>
        </section> : activeView === "projects" ? (
          <section className="dashboard-projects" aria-label="Portfolio project management">
            <form className="dashboard-project-form" onSubmit={saveProject}>
              <div className="dashboard-project-form-heading">
                <div>
                  <span className="dashboard-eyebrow">{editingProjectId === null ? "NEW PORTFOLIO ENTRY" : "EDIT PORTFOLIO ENTRY"}</span>
                  <h2>{editingProjectId === null ? "Add a project" : "Update project"}</h2>
                </div>
                {editingProjectId !== null && <button className="dashboard-project-cancel" type="button" onClick={cancelProjectEdit}><X size={15} /> Cancel</button>}
              </div>
              <div className="dashboard-project-fields">
                <label>Project name<input required minLength={2} maxLength={120} value={projectDraft.title} onChange={(event) => setProjectDraft((draft) => ({ ...draft, title: event.target.value }))} placeholder="Project title" /></label>
                <label>Category<input required minLength={2} maxLength={60} value={projectDraft.category} onChange={(event) => setProjectDraft((draft) => ({ ...draft, category: event.target.value }))} placeholder="Full-Stack, AI & Data…" /></label>
                <label className="wide">Description<textarea required minLength={10} maxLength={2000} rows={4} value={projectDraft.description} onChange={(event) => setProjectDraft((draft) => ({ ...draft, description: event.target.value }))} placeholder="What does this project do?" /></label>
                <label>Technologies<input required value={projectDraft.stack} onChange={(event) => setProjectDraft((draft) => ({ ...draft, stack: event.target.value }))} placeholder="Next.js, FastAPI, SQLite" /><span>Separate technologies with commas.</span></label>
                <label>GitHub repository<input maxLength={100} value={projectDraft.repo} onChange={(event) => setProjectDraft((draft) => ({ ...draft, repo: event.target.value }))} placeholder="repository-name" /><span>Leave empty to hide the repository link.</span></label>
                <div className="dashboard-project-image-control">
                  <div className="dashboard-image-control-heading">
                    <span>PROJECT IMAGE</span>
                    <small>Choose an upload or a hosted image link.</small>
                  </div>
                  <div className="dashboard-image-mode-switch" role="group" aria-label="Project image source">
                    <button type="button" className={projectImageMode === "upload" ? "selected" : ""} onClick={() => setProjectImageMode("upload")}>
                      <Upload size={14} /> Upload image
                    </button>
                    <button type="button" className={projectImageMode === "url" ? "selected" : ""} onClick={() => setProjectImageMode("url")}>
                      <Link2 size={14} /> Paste image URL
                    </button>
                  </div>
                  {projectImageMode === "upload" ? (
                    <label className="dashboard-upload-zone" htmlFor="project-image-file" onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
                      event.preventDefault();
                      chooseProjectImage(event.dataTransfer.files[0]);
                    }}>
                      <input id="project-image-file" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => {
                        chooseProjectImage(event.currentTarget.files?.[0]);
                        event.currentTarget.value = "";
                      }} />
                      <span className="dashboard-upload-icon">{projectImageFile ? <ImagePlus size={19} /> : <Upload size={19} />}</span>
                      <span className="dashboard-upload-copy">
                        <strong>{projectImageFile ? projectImageFile.name : "Drop an image here or browse files"}</strong>
                        <small>{projectImageFile ? `${(projectImageFile.size / (1024 * 1024)).toFixed(2)} MB · ready to upload` : "JPEG, PNG, or WebP · up to 5 MB"}</small>
                      </span>
                      {projectImageFile && <span className="dashboard-upload-ready">READY</span>}
                    </label>
                  ) : (
                    <label className="dashboard-image-url-field">
                      <span>Public HTTPS image URL</span>
                      <input required type="url" value={projectDraft.image.startsWith("https://") ? projectDraft.image : ""} onChange={(event) => setProjectDraft((draft) => ({ ...draft, image: event.target.value }))} placeholder="https://images.example.com/project.jpg" />
                      <small>Use a direct public HTTPS image link. HTTP links are not accepted.</small>
                    </label>
                  )}
                  {projectImagePreview && (
                    <div className="dashboard-project-preview">
                      <div className="dashboard-project-preview-thumb"><ProjectImage src={projectImagePreview} alt="Selected project preview" className="dashboard-project-thumbnail" sizes="160px" /></div>
                      <div><span>IMAGE PREVIEW</span><strong>{projectImageFile?.name ?? projectDraft.image}</strong></div>
                    </div>
                  )}
                  {!projectImagePreview && projectDraft.image && (
                    <div className="dashboard-project-preview">
                      <div className="dashboard-project-preview-thumb"><ProjectImage src={projectDraft.image} alt="Current project image" className="dashboard-project-thumbnail" sizes="160px" /></div>
                      <div><span>CURRENT IMAGE</span><strong>{projectDraft.image}</strong></div>
                    </div>
                  )}
                </div>
              </div>
              <button className="dashboard-project-save" type="submit" disabled={isSavingProject}>
                {editingProjectId === null ? <Plus size={16} /> : <Save size={16} />}
                {isSavingProject ? "Saving…" : editingProjectId === null ? "Add project" : "Save changes"}
              </button>
            </form>

            <div className="dashboard-project-list-heading">
              <div><span className="dashboard-eyebrow">LIVE PORTFOLIO / {projects.length.toString().padStart(2, "0")} ENTRIES</span><h2>Project order</h2></div>
              <button className="dashboard-refresh" type="button" onClick={() => void loadProjects()} disabled={isLoadingProjects}><RefreshCw size={15} className={isLoadingProjects ? "spinning" : ""} /> Refresh</button>
            </div>
            {isLoadingProjects && projects.length === 0 ? <div className="dashboard-empty">Loading projects…</div> : projects.length === 0 ? (
              <div className="dashboard-empty"><FolderKanban size={23} /><strong>No projects yet.</strong><span>Use the form above to add your first portfolio project.</span></div>
            ) : (
              <ol className="dashboard-project-list">
                {projects.map((project, index) => (
                  <li className="dashboard-project-item" key={project.id}>
                    <span className="dashboard-project-order">{String(index + 1).padStart(2, "0")}</span>
                    <div className="dashboard-project-thumb"><ProjectImage src={project.image} alt="" className="dashboard-project-thumbnail" sizes="76px" /></div>
                    <div className="dashboard-project-details">
                      <span>{project.category}</span><h3>{project.title}</h3>
                      <p>{project.description}</p>
                      <div>{project.stack.map((item) => <span key={item}>{item}</span>)}</div>
                    </div>
                    <div className="dashboard-project-actions">
                      <button type="button" onClick={() => void moveProject(index, -1)} disabled={index === 0 || isSavingProject} aria-label={`Move ${project.title} up`}><ArrowUp size={16} /></button>
                      <button type="button" onClick={() => void moveProject(index, 1)} disabled={index === projects.length - 1 || isSavingProject} aria-label={`Move ${project.title} down`}><ArrowDown size={16} /></button>
                      <button type="button" onClick={() => editProject(project)} aria-label={`Edit ${project.title}`}><Pencil size={15} /></button>
                      <button className="dashboard-project-delete" type="button" onClick={() => void deleteProject(project)} aria-label={`Delete ${project.title}`}><Trash2 size={15} /></button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        ) : (
          <section className="dashboard-projects dashboard-certificates" aria-label="Portfolio certificate management">
            <form className="dashboard-project-form" onSubmit={saveCertificate}>
              <div className="dashboard-project-form-heading">
                <div>
                  <span className="dashboard-eyebrow">{editingCertificateId === null ? "NEW PORTFOLIO CREDENTIAL" : "EDIT PORTFOLIO CREDENTIAL"}</span>
                  <h2>{editingCertificateId === null ? "Add a certificate" : "Update certificate"}</h2>
                </div>
                {editingCertificateId !== null && <button className="dashboard-project-cancel" type="button" onClick={cancelCertificateEdit}><X size={15} /> Cancel</button>}
              </div>
              <div className="dashboard-project-fields">
                <label>Certificate title<input required minLength={2} maxLength={160} value={certificateDraft.title} onChange={(event) => setCertificateDraft((draft) => ({ ...draft, title: event.target.value }))} placeholder="SQL (Advanced)" /></label>
                <label>Subject or field<input required minLength={2} maxLength={160} value={certificateDraft.field} onChange={(event) => setCertificateDraft((draft) => ({ ...draft, field: event.target.value }))} placeholder="Database engineering" /></label>
                <label>Issue date<input required minLength={2} maxLength={80} value={certificateDraft.earned} onChange={(event) => setCertificateDraft((draft) => ({ ...draft, earned: event.target.value }))} placeholder="07 Nov, 2026" /></label>
                <label>Credential ID<input required minLength={2} maxLength={120} value={certificateDraft.credential_id} onChange={(event) => setCertificateDraft((draft) => ({ ...draft, credential_id: event.target.value }))} placeholder="Credential identifier" /></label>
                <label>Issuing organization<input required minLength={2} maxLength={160} value={certificateDraft.issuer} onChange={(event) => setCertificateDraft((draft) => ({ ...draft, issuer: event.target.value }))} placeholder="HackerRank" /></label>
                <label className="dashboard-certificate-verified-field">Verification link <span className="dashboard-field-optional">OPTIONAL</span><input type="url" pattern="https://.+" maxLength={1000} autoComplete="url" value={certificateDraft.verified_url} onChange={(event) => setCertificateDraft((draft) => ({ ...draft, verified_url: event.target.value }))} placeholder="https://www.hackerrank.com/certificates/…" /><small>HTTPS link to the issuer’s public credential page.</small></label>
                <div className="dashboard-project-image-control dashboard-certificate-image-control">
                  <div className="dashboard-image-control-heading">
                    <span>CERTIFICATE IMAGE</span>
                    <small>Upload a file or use a hosted image link.</small>
                  </div>
                  <div className="dashboard-image-mode-switch" role="group" aria-label="Certificate image source">
                    <button type="button" className={certificateImageMode === "upload" ? "selected" : ""} onClick={() => setCertificateImageMode("upload")}>
                      <Upload size={14} /> Upload image
                    </button>
                    <button type="button" className={certificateImageMode === "url" ? "selected" : ""} onClick={() => setCertificateImageMode("url")}>
                      <Link2 size={14} /> Paste image URL
                    </button>
                  </div>
                  {certificateImageMode === "upload" ? (
                    <label className="dashboard-upload-zone" htmlFor="certificate-image-file" onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
                      event.preventDefault();
                      chooseCertificateImage(event.dataTransfer.files[0]);
                    }}>
                      <input id="certificate-image-file" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" required={!certificateDraft.image && !certificateImageFile} onChange={(event) => {
                        chooseCertificateImage(event.currentTarget.files?.[0]);
                        event.currentTarget.value = "";
                      }} />
                      <span className="dashboard-upload-icon">{certificateImageFile ? <ImagePlus size={19} /> : <Upload size={19} />}</span>
                      <span className="dashboard-upload-copy">
                        <strong>{certificateImageFile ? certificateImageFile.name : "Drop a certificate image here or browse files"}</strong>
                        <small>{certificateImageFile ? `${(certificateImageFile.size / (1024 * 1024)).toFixed(2)} MB · ready to upload` : "JPEG, PNG, or WebP · up to 5 MB"}</small>
                      </span>
                      {certificateImageFile && <span className="dashboard-upload-ready">READY</span>}
                    </label>
                  ) : (
                    <label className="dashboard-image-url-field">
                      <span>Public HTTPS image URL</span>
                      <input required type="url" value={certificateDraft.image.startsWith("https://") ? certificateDraft.image : ""} onChange={(event) => setCertificateDraft((draft) => ({ ...draft, image: event.target.value }))} placeholder="https://images.example.com/certificate.png" />
                      <small>Use a direct public HTTPS image link. HTTP links are not accepted.</small>
                    </label>
                  )}
                  {(certificateImagePreview || certificateDraft.image) && (
                    <div className="dashboard-certificate-preview">
                      <div className="dashboard-certificate-preview-image">
                        <ProjectImage src={certificateImagePreview ?? certificateDraft.image} alt="Certificate image preview" className="dashboard-certificate-image" sizes="180px" />
                      </div>
                      <span><strong>{certificateImageFile ? "IMAGE PREVIEW" : "CURRENT IMAGE"}</strong><small>{certificateImageFile?.name ?? certificateDraft.image}</small></span>
                    </div>
                  )}
                </div>
              </div>
              <button className="dashboard-project-save" type="submit" disabled={isSavingCertificate}>
                {editingCertificateId === null ? <Plus size={16} /> : <Save size={16} />}
                {isSavingCertificate ? "Saving…" : editingCertificateId === null ? "Add certificate" : "Save changes"}
              </button>
            </form>

            <div className="dashboard-project-list-heading">
              <div><span className="dashboard-eyebrow">LIVE PORTFOLIO / {certificates.length.toString().padStart(2, "0")} ENTRIES</span><h2>Certificate order</h2></div>
              <button className="dashboard-refresh" type="button" onClick={() => void loadCertificates()} disabled={isLoadingCertificates}><RefreshCw size={15} className={isLoadingCertificates ? "spinning" : ""} /> Refresh</button>
            </div>
            {isLoadingCertificates && certificates.length === 0 ? <div className="dashboard-empty">Loading certificates…</div> : certificates.length === 0 ? (
              <div className="dashboard-empty"><Award size={23} /><strong>No certificates yet.</strong><span>Use the form above to add your first certificate.</span></div>
            ) : (
              <ol className="dashboard-project-list dashboard-certificate-list">
                {certificates.map((certificate, index) => (
                  <li className="dashboard-project-item dashboard-certificate-item" key={certificate.id}>
                    <span className="dashboard-project-order">{String(index + 1).padStart(2, "0")}</span>
                    <a className="dashboard-certificate-thumb" href={certificate.image} target="_blank" rel="noreferrer" aria-label={`Open ${certificate.title} image`}>
                      <ProjectImage src={certificate.image} alt="" className="dashboard-certificate-image" sizes="100px" />
                    </a>
                    <div className="dashboard-project-details">
                      <span>{certificate.issuer} / {certificate.field}</span><h3>{certificate.title}</h3>
                      <p>Issued {certificate.earned} <span aria-hidden="true">·</span> ID: {certificate.credential_id}</p>
                      {certificate.verified_url && <a className="dashboard-certificate-verify" href={certificate.verified_url} target="_blank" rel="noopener noreferrer" aria-label={`Verify ${certificate.title} on ${certificate.issuer}`}><ShieldCheck size={13} /> Verify credential</a>}
                    </div>
                    <div className="dashboard-project-actions">
                      <button type="button" onClick={() => void moveCertificate(index, -1)} disabled={index === 0 || isSavingCertificate} aria-label={`Move ${certificate.title} up`}><ArrowUp size={16} /></button>
                      <button type="button" onClick={() => void moveCertificate(index, 1)} disabled={index === certificates.length - 1 || isSavingCertificate} aria-label={`Move ${certificate.title} down`}><ArrowDown size={16} /></button>
                      <button type="button" onClick={() => editCertificate(certificate)} aria-label={`Edit ${certificate.title}`}><Pencil size={15} /></button>
                      <button className="dashboard-project-delete" type="button" onClick={() => void deleteCertificate(certificate)} aria-label={`Delete ${certificate.title}`}><Trash2 size={15} /></button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}

        {activeView === "profile" && (
          <section className="space-y-4" aria-label="Admin profile management">
            <div className="rounded-2xl border border-[#e4d8c7] bg-[#fffdfa] p-5 shadow-xs sm:p-6">
              <div className="mb-5 flex items-center gap-3 border-b border-[#ece2d5] pb-4">
                <span className="grid size-10 place-items-center rounded-xl border border-[#ebdcc9] bg-[#fbf5e9] text-[#d75e2e]">
                  <UserRound size={20} />
                </span>
                <div>
                  <h2 className="m-0 text-sm font-bold text-[#231d17]">Your profile</h2>
                  <p className="m-0 text-xs text-[#786a57]">Manage your display name, email, phone, and profile photo.</p>
                </div>
              </div>
              <form onSubmit={saveProfile} className="space-y-4">
                <div className="flex items-center gap-4 rounded-xl border border-[#ebdcc9] bg-[#fbf5e9]/50 p-4">
                  <span
                    className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-full border border-[#e2d5c3]"
                    style={{ background: "linear-gradient(135deg, #f5ecdd, #fbf5e9)", color: "#a1552a" }}
                  >
                    {profileAvatarPreview ? (
                      <ProjectImage
                        src={profileAvatarPreview}
                        alt="Profile preview"
                        className="size-full object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <UserRound size={24} aria-hidden="true" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="m-0 text-xs font-semibold text-[#231d17]">Profile photo</p>
                    <p className="m-0 text-[10px] text-[#786a57]">JPEG, PNG, or WebP up to 5 MB</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#e2d5c3] bg-white px-3 py-1.5 text-[11px] font-medium text-[#231d17] shadow-xs transition hover:bg-[#fbf5e9]">
                        <ImagePlus size={13} className="text-[#d75e2e]" />
                        <span>{profileAvatarFile ? "Change photo" : "Choose photo"}</span>
                        <input
                          ref={profileFileRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="sr-only"
                          onChange={(e) => chooseProfileAvatar(e.currentTarget.files?.[0])}
                        />
                      </label>
                      {profileAvatarFile && (
                        <button
                          type="button"
                          onClick={() => {
                            setProfileAvatarFile(null);
                            setProfileAvatarPreview(null);
                            if (profileFileRef.current) profileFileRef.current.value = "";
                          }}
                          className="text-[11px] text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label htmlFor="profile-name" className="flex items-center gap-1.5 text-xs font-semibold text-[#231d17]">
                      <UserRound size={13} className="text-[#d75e2e]" />
                      Full name
                    </label>
                    <input
                      id="profile-name"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      required
                      minLength={2}
                      maxLength={100}
                      className="min-h-10 w-full rounded-xl border border-[#e2d5c3] bg-white px-3.5 text-xs text-[#231d17] shadow-xs outline-none transition placeholder:text-[#948471] hover:border-[#cfbfa9] focus:border-[#d75e2e] focus:ring-3 focus:ring-[#d75e2e]/10 sm:text-sm"
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="profile-email" className="flex items-center gap-1.5 text-xs font-semibold text-[#231d17]">
                      <Mail size={13} className="text-[#d75e2e]" />
                      Email address
                    </label>
                    <input
                      id="profile-email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      type="email"
                      maxLength={254}
                      className="min-h-10 w-full rounded-xl border border-[#e2d5c3] bg-white px-3.5 text-xs text-[#231d17] shadow-xs outline-none transition placeholder:text-[#948471] hover:border-[#cfbfa9] focus:border-[#d75e2e] focus:ring-3 focus:ring-[#d75e2e]/10 sm:text-sm"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="profile-phone" className="flex items-center gap-1.5 text-xs font-semibold text-[#231d17]">
                      <MessageSquare size={13} className="text-[#d75e2e]" />
                      Phone number
                    </label>
                    <input
                      id="profile-phone"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      type="tel"
                      maxLength={30}
                      className="min-h-10 w-full rounded-xl border border-[#e2d5c3] bg-white px-3.5 text-xs text-[#231d17] shadow-xs outline-none transition placeholder:text-[#948471] hover:border-[#cfbfa9] focus:border-[#d75e2e] focus:ring-3 focus:ring-[#d75e2e]/10 sm:text-sm"
                      placeholder="+212 …"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-[#ece2d5] pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileName("");
                      setProfileEmail("");
                      setProfilePhone("");
                      setProfileAvatarFile(null);
                      setProfileAvatarPreview(null);
                      if (profileFileRef.current) profileFileRef.current.value = "";
                    }}
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#e2d5c3] bg-white px-4 text-xs font-semibold text-[#2b241b] shadow-xs transition hover:bg-[#fbf5e9]"
                  >
                    <X size={14} /> Clear
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
            </div>
          </section>
        )}

        <p className="dashboard-footnote">Private dashboard access is limited to your authenticated session. Sign out on shared devices.</p>
      </div>
    </main>
  );
}
