"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowUp, Award, ChevronLeft, ChevronRight, FolderKanban, ImagePlus, Link2, LogOut, Mail, MailOpen, Pencil, Plus, RefreshCw, Save, Search, ShieldCheck, Trash2, Upload, X } from "lucide-react";
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
  visual: "game" | "database" | "archive" | "network";
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

function emptyProjectDraft(): ProjectDraft {
  return {
    title: "",
    category: "",
    description: "",
    stack: "",
    repo: "",
    image: "",
    visual: "game",
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
    && typeof value.image === "string"
    && "visual" in value
    && (value.visual === "game" || value.visual === "database" || value.visual === "archive" || value.visual === "network");
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

function isUploadedImage(value: unknown, directory: "/projects/" | "/certificates/"): value is { image: string } {
  return isRecord(value) && typeof value.image === "string" && value.image.startsWith(directory);
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

export default function DashboardClient({ allowLocalUploads }: { allowLocalUploads: boolean }) {
  const [username, setUsername] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isLoadingCertificates, setIsLoadingCertificates] = useState(false);
  const [isSavingCertificate, setIsSavingCertificate] = useState(false);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [projects, setProjects] = useState<ManagedProject[]>([]);
  const [certificates, setCertificates] = useState<ManagedCertificate[]>([]);
  const [activeView, setActiveView] = useState<"messages" | "projects" | "certificates">("messages");
  const [projectDraft, setProjectDraft] = useState<ProjectDraft>(emptyProjectDraft);
  const [certificateDraft, setCertificateDraft] = useState<CertificateDraft>(emptyCertificateDraft);
  const [projectImageMode, setProjectImageMode] = useState<ProjectImageMode>(allowLocalUploads ? "upload" : "url");
  const [projectImageFile, setProjectImageFile] = useState<File | null>(null);
  const [projectImagePreview, setProjectImagePreview] = useState<string | null>(null);
  const [certificateImageMode, setCertificateImageMode] = useState<ProjectImageMode>(allowLocalUploads ? "upload" : "url");
  const [certificateImageFile, setCertificateImageFile] = useState<File | null>(null);
  const [certificateImagePreview, setCertificateImagePreview] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [editingCertificateId, setEditingCertificateId] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [filter, setFilter] = useState<MessageFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

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
        await Promise.all([loadMessages(0), loadProjects(), loadCertificates()]);
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
  }, [loadCertificates, loadMessages, loadProjects]);

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
      setCertificateImageMode(allowLocalUploads ? "upload" : "url");
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
        if (!isUploadedImage(uploadResult, "/projects/")) throw new Error("The dashboard returned an invalid uploaded image.");
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
      setProjectImageMode(allowLocalUploads ? "upload" : "url");
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
      visual: project.visual,
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
    setProjectImageMode(allowLocalUploads ? "upload" : "url");
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
        if (!isUploadedImage(uploadResult, "/certificates/")) {
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
      setCertificateImageMode(allowLocalUploads ? "upload" : "url");
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
    setCertificateImageMode(allowLocalUploads ? "upload" : "url");
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
          <Link className="dashboard-home-link" href="/"><ArrowLeft size={15} /> Portfolio</Link>
          <button className="dashboard-logout" type="button" onClick={handleLogout}><LogOut size={15} /> Sign out</button>
        </header>

        <section className="dashboard-heading">
          <p className="dashboard-eyebrow">PRIVATE DASHBOARD / {username}</p>
          <h1>{activeView === "messages" ? "Messages" : activeView === "projects" ? "Projects" : "Certificates"}<span>.</span></h1>
          <p>{activeView === "messages" ? "Review and manage messages sent through your portfolio." : activeView === "projects" ? "Edit the projects shown on your public portfolio." : "Add, update, and arrange the credentials shown on your public portfolio."}</p>
        </section>

        <nav className="dashboard-view-switch" aria-label="Dashboard sections">
          <button type="button" className={activeView === "messages" ? "selected" : ""} onClick={() => { setActiveView("messages"); setError(""); setNotice(""); }} aria-pressed={activeView === "messages"}>
            <Mail size={16} /> Messages <span>{total}</span>
          </button>
          <button type="button" className={activeView === "projects" ? "selected" : ""} onClick={() => { setActiveView("projects"); setError(""); setNotice(""); }} aria-pressed={activeView === "projects"}>
            <FolderKanban size={16} /> Projects <span>{projects.length}</span>
          </button>
          <button type="button" className={activeView === "certificates" ? "selected" : ""} onClick={() => { setActiveView("certificates"); setError(""); setNotice(""); }} aria-pressed={activeView === "certificates"}>
            <Award size={16} /> Certificates <span>{certificates.length}</span>
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

        {activeView === "messages" ? <section className="dashboard-inbox" aria-label="Contact messages">
          <div className="dashboard-inbox-toolbar">
            <label className="dashboard-search">
              <span className="sr-only">Search messages on this page</span>
              <Search size={16} aria-hidden="true" />
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
                    <button type="button" className={projectImageMode === "upload" ? "selected" : ""} onClick={() => setProjectImageMode("upload")} disabled={!allowLocalUploads}>
                      <Upload size={14} /> Upload image
                    </button>
                    <button type="button" className={projectImageMode === "url" ? "selected" : ""} onClick={() => setProjectImageMode("url")}>
                      <Link2 size={14} /> Paste image URL
                    </button>
                  </div>
                  {projectImageMode === "upload" && allowLocalUploads ? (
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
                  ) : projectImageMode === "upload" ? (
                    <p className="dashboard-image-production-note">Local uploads are available during development. For production, paste a public HTTPS image URL.</p>
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
                <label>Card artwork<select value={projectDraft.visual} onChange={(event) => {
                  const visual = event.target.value;
                  if (visual === "game" || visual === "database" || visual === "archive" || visual === "network") {
                    setProjectDraft((draft) => ({ ...draft, visual }));
                  }
                }}>
                  <option value="game">Interactive / game</option>
                  <option value="database">Backend / database</option>
                  <option value="archive">Archive / web</option>
                  <option value="network">AI / network</option>
                </select></label>
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
                    <button type="button" className={certificateImageMode === "upload" ? "selected" : ""} onClick={() => setCertificateImageMode("upload")} disabled={!allowLocalUploads}>
                      <Upload size={14} /> Upload image
                    </button>
                    <button type="button" className={certificateImageMode === "url" ? "selected" : ""} onClick={() => setCertificateImageMode("url")}>
                      <Link2 size={14} /> Paste image URL
                    </button>
                  </div>
                  {certificateImageMode === "upload" && allowLocalUploads ? (
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
                  ) : certificateImageMode === "upload" ? (
                    <p className="dashboard-image-production-note">Local uploads are available during development. For production, paste a public HTTPS image URL.</p>
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
        <p className="dashboard-footnote">Private dashboard access is limited to your authenticated session. Sign out on shared devices.</p>
      </div>
    </main>
  );
}
