"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { ArrowDown, ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, Award, BrainCircuit, ChartNoAxesColumn, Check, Code2, Copy, Database, ExternalLink, Gamepad2, GitBranch, Mail, Menu, MoveUpRight, ShieldCheck, Smartphone, Send, X, type LucideIcon } from "lucide-react";
import { FaGithub as Github, FaInstagram as Instagram, FaLinkedin as Linkedin, FaWhatsapp as WhatsApp } from "react-icons/fa6";
import type { IconType } from "react-icons";
import {
  SiArduino,
  SiBlender,
  SiBootstrap,
  SiDart,
  SiDocker,
  SiDjango,
  SiExpress,
  SiFirebase,
  SiFastapi,
  SiFlask,
  SiFlutter,
  SiGit,
  SiGithub,
  SiGithubactions,
  SiGodotengine,
  SiHuggingface,
  SiJavascript,
  SiKalilinux,
  SiKotlin,
  SiKubernetes,
  SiLangchain,
  SiLaravel,
  SiLinux,
  SiMongodb,
  SiMysql,
  SiNextdotjs,
  SiNumpy,
  SiOwasp,
  SiOpencv,
  SiPandas,
  SiPhp,
  SiPostgresql,
  SiPytorch,
  SiPython,
  SiReact,
  SiScikitlearn,
  SiSqlite,
  SiTailwindcss,
  SiThreedotjs,
  SiTypescript,
  SiAndroidstudio,
} from "react-icons/si";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import ProjectImage from "./project-image";

const links = [
  { label: "About", href: "#about" },
  { label: "Expertise", href: "#expertise" },
  { label: "Projects", href: "#projects" },
  { label: "Journey", href: "#journey" },
  { label: "Contact", href: "#contact" },
];

type PortfolioCertificate = {
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

const certificates: PortfolioCertificate[] = [
  {
    id: 1,
    sort_order: 0,
    title: "Node.js (Intermediate)",
    field: "Node.js development",
    earned: "04 Nov, 2026",
    credential_id: "AB1E7FB6D70E",
    issuer: "HackerRank",
    verified_url: "https://www.hackerrank.com/certificates/ab1e7fb6d70e",
    image: "/certificates/Node.JS (Intermediate) - HackerRank.png",
  },
  {
    id: 2,
    sort_order: 1,
    title: "SQL (Advanced)",
    field: "Database engineering",
    earned: "31 Oct, 2026",
    credential_id: "86A7A0BE2146",
    issuer: "HackerRank",
    verified_url: "https://www.hackerrank.com/certificates/86a7a0be2146",
    image: "/certificates/SQL (advanced) - HackerRank.png",
  },
  {
    id: 3,
    sort_order: 2,
    title: "Problem Solving (Intermediate)",
    field: "Algorithms & problem solving",
    earned: "04 Nov, 2026",
    credential_id: "9D75E59DED53",
    issuer: "HackerRank",
    verified_url: "https://www.hackerrank.com/certificates/9d75e59ded53",
    image: "/certificates/Problem Solving (Intermediate) - HackerRank.png",
  },
];

function isPortfolioCertificate(value: unknown): value is PortfolioCertificate {
  if (typeof value !== "object" || value === null) return false;
  return "id" in value && typeof value.id === "number" && Number.isInteger(value.id)
    && "sort_order" in value && typeof value.sort_order === "number" && Number.isInteger(value.sort_order)
    && "title" in value && typeof value.title === "string"
    && "field" in value && typeof value.field === "string"
    && "earned" in value && typeof value.earned === "string"
    && "credential_id" in value && typeof value.credential_id === "string"
    && "issuer" in value && typeof value.issuer === "string"
    && "verified_url" in value && typeof value.verified_url === "string"
    && "image" in value && typeof value.image === "string";
}

type ProjectVisual = "game" | "database" | "archive" | "network";
type PortfolioProject = {
  id: number;
  sort_order: number;
  number: string;
  title: string;
  category: string;
  description: string;
  stack: string[];
  repo: string;
  image: string;
  visual: ProjectVisual;
};

const projects: PortfolioProject[] = [
  {
    id: 1,
    sort_order: 0,
    number: "01",
    title: "3D Game / Arduino",
    category: "Interactive",
    description:
      "A browser-based 3D game paired with a physical joystick. Three.js renders the experience while an Arduino Uno sends joystick and button input over serial.",
    stack: ["Three.js", "Arduino", "JavaScript"],
    repo: "3D-Game-Arduino",
    image: "/projects/arduino-circuit.jpg",
    visual: "game",
  },
  {
    id: 2,
    sort_order: 1,
    number: "02",
    title: "Students Management System",
    category: "Backend",
    description:
      "A FastAPI and SQLAlchemy student record app with registration, student listing, editing, deletion, and a basic analysis view. PostgreSQL is configured as its database.",
    stack: ["FastAPI", "SQLAlchemy", "PostgreSQL"],
    repo: "Students_management_system_FastAPI",
    image: "/projects/student-analytics.jpg",
    visual: "database",
  },
  {
    id: 3,
    sort_order: 2,
    number: "03",
    title: "2BAC Archive",
    category: "Web",
    description:
      "A web archive project focused on collecting and preserving historical documents, images, and other materials connected to the 2 BAC community.",
    stack: ["HTML", "Web"],
    repo: "2BAC-Archive-Web",
    image: "/projects/archive-library.jpg",
    visual: "archive",
  },
  {
    id: 4,
    sort_order: 3,
    number: "04",
    title: "LLM & Vector Databases",
    category: "AI & Data",
    description:
      "A compact learning repository introducing large language models, vector databases such as Chroma, and embedding models. A starting point for hands-on exploration.",
    stack: ["Python", "LLMs", "Chroma"],
    repo: "LLM_VectorDBs",
    image: "/projects/ai-neural-network.jpg",
    visual: "network",
  },
];

function isPortfolioProject(value: unknown): value is Omit<PortfolioProject, "number"> {
  if (typeof value !== "object" || value === null) return false;
  const project = value;
  return "id" in project
    && typeof project.id === "number"
    && Number.isInteger(project.id)
    && "sort_order" in project
    && typeof project.sort_order === "number"
    && Number.isInteger(project.sort_order)
    && "title" in project
    && typeof project.title === "string"
    && "category" in project
    && typeof project.category === "string"
    && "description" in project
    && typeof project.description === "string"
    && "stack" in project
    && Array.isArray(project.stack)
    && project.stack.every((item) => typeof item === "string")
    && "repo" in project
    && typeof project.repo === "string"
    && "image" in project
    && typeof project.image === "string"
    && "visual" in project
    && (project.visual === "game" || project.visual === "database" || project.visual === "archive" || project.visual === "network");
}

const skillPaths = [
  {
    number: "01",
    name: "Software engineering",
    description: "Designing and delivering the frontend, backend, and workflows behind useful products.",
    icon: Code2,
    groups: [
      { name: "Frontend", tools: ["Next.js", "React", "TypeScript", "JavaScript", "Tailwind CSS", "Bootstrap"] },
      { name: "Backend", tools: ["FastAPI", "Flask", "Django", "Laravel", "Express.js"] },
      { name: "Workflow & delivery", tools: ["Git", "GitHub", "Docker", "Kubernetes", "GitHub Actions", "Linux", "CI / CD"] },
    ],
  },
  {
    number: "02",
    name: "Data science & AI",
    description: "Analyzing data and exploring how machine-learning systems are built.",
    icon: BrainCircuit,
    groups: [
      { name: "Analysis", tools: ["Python", "NumPy", "Pandas", "Matplotlib", "Seaborn"] },
      { name: "Machine learning", tools: ["PyTorch", "scikit-learn", "OpenCV"] },
      { name: "Language models", tools: ["RAG pipelines", "Embeddings & vector databases", "LoRA / PEFT", "LangChain", "Hugging Face"] },
      { name: "Databases", tools: ["PostgreSQL", "MySQL", "SQLite", "MongoDB"] },
    ],
  },
  {
    number: "03",
    name: "Mobile development",
    description: "Exploring cross-platform app development and the services that support mobile products.",
    icon: Smartphone,
    groups: [
      { name: "App development", tools: ["Flutter", "Dart", "React Native"] },
      { name: "Platform & services", tools: ["Android Studio", "Firebase"] },
    ],
  },
  {
    number: "04",
    name: "Cybersecurity",
    description: "Learning practical security principles and how to build safer software.",
    icon: ShieldCheck,
    groups: [
      { name: "Security fundamentals", tools: ["OWASP Top 10", "Secure coding", "Threat modeling"] },
      { name: "Platforms", tools: ["Linux", "Kali Linux"] },
    ],
  },
  {
    number: "05",
    name: "Interactive media",
    description: "Creating realtime graphics and connecting software to physical controls.",
    icon: Gamepad2,
    groups: [
      { name: "3D & graphics", tools: ["Three.js", "Blender"] },
      { name: "Game development", tools: ["Godot", "GDScript"] },
      { name: "Physical computing", tools: ["Arduino"] },
    ],
  },
  {
    number: "06",
    name: "Programming languages",
    description: "Languages I use across application development, data projects, and interactive work.",
    icon: Code2,
    groups: [
      { name: "Languages", tools: ["TypeScript", "JavaScript", "Python", "PHP", "Dart", "Kotlin", "GDScript"] },
    ],
  },
];

const skillIcons: Record<string, IconType> = {
  "Next.js": SiNextdotjs,
  React: SiReact,
  TypeScript: SiTypescript,
  JavaScript: SiJavascript,
  "Tailwind CSS": SiTailwindcss,
  Bootstrap: SiBootstrap,
  Flutter: SiFlutter,
  Dart: SiDart,
  "React Native": SiReact,
  "Android Studio": SiAndroidstudio,
  Firebase: SiFirebase,
  "OWASP Top 10": SiOwasp,
  "Kali Linux": SiKalilinux,
  PHP: SiPhp,
  Kotlin: SiKotlin,
  "Three.js": SiThreedotjs,
  FastAPI: SiFastapi,
  Flask: SiFlask,
  Django: SiDjango,
  Laravel: SiLaravel,
  "Express.js": SiExpress,
  Python: SiPython,
  NumPy: SiNumpy,
  Pandas: SiPandas,
  PostgreSQL: SiPostgresql,
  MySQL: SiMysql,
  SQLite: SiSqlite,
  MongoDB: SiMongodb,
  PyTorch: SiPytorch,
  "scikit-learn": SiScikitlearn,
  OpenCV: SiOpencv,
  "LangChain": SiLangchain,
  "Hugging Face": SiHuggingface,
  Godot: SiGodotengine,
  Blender: SiBlender,
  Arduino: SiArduino,
  Git: SiGit,
  GitHub: SiGithub,
  Docker: SiDocker,
  Kubernetes: SiKubernetes,
  "GitHub Actions": SiGithubactions,
  Linux: SiLinux,
};

const skillIconColors: Record<string, string> = {
  "Next.js": "#171717",
  React: "#159fc0",
  TypeScript: "#3178c6",
  JavaScript: "#c99b16",
  "Tailwind CSS": "#139bb3",
  Bootstrap: "#7651b5",
  Flutter: "#168de2",
  Dart: "#0875b9",
  "React Native": "#159fc0",
  "Android Studio": "#4c8b47",
  Firebase: "#e5a528",
  "OWASP Top 10": "#8f2638",
  "Kali Linux": "#3973a8",
  PHP: "#777bb4",
  Kotlin: "#8863d6",
  "Three.js": "#4f493e",
  FastAPI: "#168d80",
  Flask: "#33302c",
  Django: "#126746",
  Laravel: "#e85242",
  "Express.js": "#44413a",
  Python: "#3476a8",
  NumPy: "#4b75a1",
  Pandas: "#7751ad",
  PostgreSQL: "#38648a",
  MySQL: "#087b9c",
  SQLite: "#3575a5",
  MongoDB: "#408b4b",
  PyTorch: "#ee7145",
  "scikit-learn": "#d58236",
  OpenCV: "#5573a5",
  LangChain: "#27856a",
  "Hugging Face": "#b88318",
  Godot: "#4674a5",
  Blender: "#dd772a",
  Arduino: "#008d9d",
  Git: "#d9583d",
  GitHub: "#36312e",
  Docker: "#258dc2",
  Kubernetes: "#4267b2",
  "GitHub Actions": "#4267b2",
  Linux: "#b68b11",
};

const skillConceptIcons: Record<string, LucideIcon> = {
  Matplotlib: ChartNoAxesColumn,
  Seaborn: ChartNoAxesColumn,
  "RAG pipelines": BrainCircuit,
  "Embeddings & vector databases": Database,
  "LoRA / PEFT": BrainCircuit,
  GDScript: Code2,
  "CI / CD": GitBranch,
  "Secure coding": Code2,
  "Threat modeling": ShieldCheck,
};

function Label({ children }: { children: ReactNode }) {
  return <span className="eyebrow"><span className="eyebrow-dot" />{children}</span>;
}

function TechnologyCarousel() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const navigateTo = useCallback((index: number, direction: "next" | "previous" | "direct" = "direct", animate = true) => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const nextIndex = (index + skillPaths.length) % skillPaths.length;
    const previousIndex = activeIndexRef.current;
    const isForwardWrap = direction === "next" && previousIndex === skillPaths.length - 1 && nextIndex === 0;
    const isBackwardWrap = direction === "previous" && previousIndex === 0 && nextIndex === skillPaths.length - 1;
    const slideIndex = isForwardWrap ? skillPaths.length + 1 : isBackwardWrap ? 0 : nextIndex + 1;
    const slide = track.children.item(slideIndex);
    if (!(slide instanceof HTMLElement)) return;

    track.style.paddingInline = `${Math.max(0, (viewport.clientWidth - slide.offsetWidth) / 2)}px`;
    const offset = slide.offsetLeft + slide.offsetWidth / 2 - viewport.clientWidth / 2;
    activeIndexRef.current = nextIndex;
    setActiveIndex(nextIndex);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.killTweensOf(track);
    if (!animate || reducedMotion) {
      gsap.set(track, { x: -offset });
      return;
    }

    gsap.to(track, {
      x: -offset,
      duration: 0.8,
      ease: "power3.inOut",
      overwrite: true,
      onComplete: () => {
        if (isForwardWrap || isBackwardWrap) {
          const realSlide = track.children.item(nextIndex + 1);
          if (realSlide instanceof HTMLElement) {
            gsap.set(track, { x: -(realSlide.offsetLeft + realSlide.offsetWidth / 2 - viewport.clientWidth / 2) });
          }
        }
      },
    });
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport) return;

    const observer = new ResizeObserver(() => navigateTo(activeIndexRef.current, "direct", false));
    observer.observe(viewport);
    return () => {
      observer.disconnect();
      if (track) gsap.killTweensOf(track);
    };
  }, [navigateTo]);

  useEffect(() => {
    if (isHovered || isFocused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = gsap.delayedCall(4.2, () => {
      navigateTo((activeIndexRef.current + 1) % skillPaths.length, "next");
    });
    return () => {
      timer.kill();
    };
  }, [activeIndex, isFocused, isHovered, navigateTo]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      navigateTo(activeIndex + 1, "next");
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      navigateTo(activeIndex - 1, "previous");
    }
  };

  return (
    <div
      className="technology-carousel reveal"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsFocused(true)}
      onBlurCapture={(event) => {
        const nextFocusedElement = event.relatedTarget;
        if (!(nextFocusedElement instanceof Node) || !event.currentTarget.contains(nextFocusedElement)) {
          setIsFocused(false);
        }
      }}
    >
      <div className="technology-carousel-toolbar">
        <div className="technology-carousel-controls" aria-label="Technology carousel controls">
          <button type="button" onClick={() => navigateTo(activeIndex - 1, "previous")} aria-label="Previous technology card">
            <ArrowLeft size={17} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => navigateTo(activeIndex + 1, "next")} aria-label="Next technology card">
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        className="technology-carousel-viewport"
        ref={viewportRef}
        role="region"
        aria-label="Technology paths"
        aria-roledescription="carousel"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <div className="technology-carousel-track" ref={trackRef}>
          {[
            { path: skillPaths[skillPaths.length - 1], clone: "leading" },
            ...skillPaths.map((path) => ({ path, clone: undefined })),
            { path: skillPaths[0], clone: "trailing" },
          ].map(({ path, clone }) => (
            <article
              className={`technology-card${!clone && skillPaths[activeIndex] === path ? " is-active" : ""}`}
              id={clone ? undefined : `path-${path.number}`}
              key={clone ?? path.number}
              aria-labelledby={clone ? undefined : `path-title-${path.number}`}
              aria-hidden={Boolean(clone)}
            >
              <div className="technology-card-heading">
                <span className="technology-card-icon"><path.icon size={20} strokeWidth={1.7} aria-hidden="true" /></span>
                <span className="technology-card-index">PATH / {path.number}</span>
                <h3 id={clone ? undefined : `path-title-${path.number}`}>{path.name}</h3>
                <p>{path.description}</p>
              </div>
              <div className="technology-card-groups">
                {path.groups.map((group) => (
                  <section className="technology-card-group" key={group.name} aria-label={group.name}>
                    <h4>{group.name}</h4>
                    <div className="technology-tool-list">
                      {group.tools.map((tool) => {
                        const BrandIcon = skillIcons[tool];
                        const ConceptIcon = skillConceptIcons[tool];
                        return (
                          <span className="technology-tool" key={tool}>
                            {BrandIcon ? <BrandIcon size={15} color={skillIconColors[tool]} aria-hidden="true" /> : ConceptIcon ? <ConceptIcon size={14} aria-hidden="true" /> : null}
                            {tool}
                          </span>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="technology-carousel-pagination" role="group" aria-label="Choose a technology card">
        {skillPaths.map((path, index) => (
          <button
            type="button"
            className={index === activeIndex ? "active" : ""}
            key={path.number}
            onClick={() => navigateTo(index, "direct")}
            aria-label={`Show ${path.name}`}
            aria-current={index === activeIndex ? "step" : undefined}
          />
        ))}
      </div>
    </div>
  );
}

function CertificateCarousel({ certificates: items }: { certificates: PortfolioCertificate[] }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const navigateTo = useCallback((index: number, direction: "next" | "previous" | "direct" = "direct", animate = true, syncState = true) => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track || items.length === 0) return;

    const nextIndex = (index + items.length) % items.length;
    const previousIndex = activeIndexRef.current;
    const isForwardWrap = direction === "next" && previousIndex === items.length - 1 && nextIndex === 0;
    const isBackwardWrap = direction === "previous" && previousIndex === 0 && nextIndex === items.length - 1;
    const slideIndex = items.length === 1 ? 0 : isForwardWrap ? items.length + 1 : isBackwardWrap ? 0 : nextIndex + 1;
    const slide = track.children.item(slideIndex);
    if (!(slide instanceof HTMLElement)) return;

    track.style.paddingInline = `${Math.max(0, (viewport.clientWidth - slide.offsetWidth) / 2)}px`;
    const offset = slide.offsetLeft + slide.offsetWidth / 2 - viewport.clientWidth / 2;
    activeIndexRef.current = nextIndex;
    if (syncState) setActiveIndex(nextIndex);
    gsap.killTweensOf(track);
    if (!animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(track, { x: -offset });
      return;
    }

    gsap.to(track, {
      x: -offset,
      duration: 0.6,
      ease: "power3.inOut",
      overwrite: true,
      onComplete: () => {
        if (!isForwardWrap && !isBackwardWrap) return;
        const realSlide = track.children.item(nextIndex + 1);
        if (realSlide instanceof HTMLElement) {
          gsap.set(track, { x: -(realSlide.offsetLeft + realSlide.offsetWidth / 2 - viewport.clientWidth / 2) });
        }
      },
    });
  }, [items.length]);

  useEffect(() => {
    activeIndexRef.current = items.length > 0
      ? Math.min(activeIndexRef.current, items.length - 1)
      : 0;
    navigateTo(activeIndexRef.current, "direct", false, false);
  }, [items.length, navigateTo]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || items.length === 0) return;
    const observer = new ResizeObserver(() => navigateTo(activeIndexRef.current, "direct", false));
    observer.observe(viewport);
    return () => {
      observer.disconnect();
      if (track) gsap.killTweensOf(track);
    };
  }, [items.length, navigateTo]);

  useEffect(() => {
    if (items.length < 2 || isHovered || isFocused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = gsap.delayedCall(3.2, () => navigateTo(activeIndexRef.current + 1, "next"));
    return () => {
      timer.kill();
    };
  }, [activeIndex, isFocused, isHovered, items.length, navigateTo]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      navigateTo(activeIndex + 1, "next");
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      navigateTo(activeIndex - 1, "previous");
    }
  };

  if (items.length === 0) {
    return <p className="certificate-empty">New credentials will appear here as they are added.</p>;
  }

  const slides = items.length > 1
    ? [{ certificate: items[items.length - 1], clone: "leading" }, ...items.map((certificate) => ({ certificate, clone: undefined })), { certificate: items[0], clone: "trailing" }]
    : items.map((certificate) => ({ certificate, clone: undefined }));

  return (
    <div
      className="certificate-carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsFocused(true)}
      onBlurCapture={(event) => {
        const nextFocusedElement = event.relatedTarget;
        if (!(nextFocusedElement instanceof Node) || !event.currentTarget.contains(nextFocusedElement)) setIsFocused(false);
      }}
    >
      <div className="certificate-carousel-toolbar">
        <div className="certificate-carousel-controls" aria-label="Certificate carousel controls">
          <button type="button" onClick={() => navigateTo(activeIndex - 1, "previous")} aria-label="Previous certificate" disabled={items.length < 2}>
            <ArrowLeft size={17} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => navigateTo(activeIndex + 1, "next")} aria-label="Next certificate" disabled={items.length < 2}>
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div
        className="certificate-carousel-viewport"
        ref={viewportRef}
        role="region"
        aria-label="Certificates"
        aria-roledescription="carousel"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <div className="certificate-carousel-track" ref={trackRef}>
          {slides.map(({ certificate, clone }, slideIndex) => {
            const realIndex = clone === "leading" ? items.length - 1 : clone === "trailing" ? 0 : slideIndex - (items.length > 1 ? 1 : 0);
            return (
              <article
                className={`certificate-card${!clone && realIndex === activeIndex ? " is-active" : ""}`}
                key={clone ?? certificate.id}
                aria-hidden={Boolean(clone)}
              >
                <a
                  className="certificate-preview"
                  href={certificate.image}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open full ${certificate.title} certificate`}
                  tabIndex={clone ? -1 : undefined}
                >
                  <ProjectImage
                    src={certificate.image}
                    alt={`${certificate.title} certificate awarded to Ahmed Bouramdane`}
                    className="certificate-image"
                    sizes="(max-width: 760px) 82vw, 350px"
                  />
                  <span className="certificate-preview-action"><ExternalLink size={14} /> View original</span>
                  <span className="certificate-index">CREDENTIAL / {String(realIndex + 1).padStart(2, "0")}</span>
                </a>
                <div className="certificate-details">
                  <div className="certificate-title-row">
                    <span className="certificate-icon"><Award size={17} strokeWidth={1.7} /></span>
                    {certificate.verified_url ? (
                      <a className="certificate-verify-link" href={certificate.verified_url} target="_blank" rel="noopener noreferrer" aria-label={`Verify ${certificate.title} on ${certificate.issuer}`} title={`Verify on ${certificate.issuer}`}>
                        <ShieldCheck size={13} /> <span>Verify credential</span><ExternalLink size={11} />
                      </a>
                    ) : (
                      <span className="certificate-issuer"><ShieldCheck size={13} /> {certificate.issuer}</span>
                    )}
                  </div>
                  <h3>{certificate.title}</h3>
                  <p>{certificate.field}</p>
                  <div className="certificate-meta">
                    <span><small>ISSUED</small><strong>{certificate.earned}</strong></span>
                    <span><small>CREDENTIAL ID</small><strong>{certificate.credential_id}</strong></span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
      <div className="certificate-carousel-pagination" role="group" aria-label="Choose a certificate">
        {items.map((certificate, index) => (
          <button
            type="button"
            className={index === activeIndex ? "active" : ""}
            key={certificate.id}
            onClick={() => navigateTo(index)}
            aria-label={`Show ${certificate.title}`}
            aria-current={index === activeIndex ? "step" : undefined}
          />
        ))}
      </div>
    </div>
  );
}
function ProjectCard({ project }: { project: PortfolioProject }) {
  const cardRef = useRef<HTMLElement>(null);
  const rotateX = useRef<((value: number) => void) | null>(null);
  const rotateY = useRef<((value: number) => void) | null>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    gsap.set(card, { transformPerspective: 1100, transformOrigin: "center" });
    rotateX.current = gsap.quickTo(card, "rotationX", { duration: 0.45, ease: "power3.out" });
    rotateY.current = gsap.quickTo(card, "rotationY", { duration: 0.45, ease: "power3.out" });
    return () => {
      gsap.killTweensOf(card);
    };
  }, []);

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    rotateX.current?.((0.5 - y) * 5);
    rotateY.current?.((x - 0.5) * 5);
    event.currentTarget.style.setProperty("--pointer-x", `${x * 100}%`);
    event.currentTarget.style.setProperty("--pointer-y", `${y * 100}%`);
  };

  const handlePointerLeave = (event: ReactPointerEvent<HTMLElement>) => {
    rotateX.current?.(0);
    rotateY.current?.(0);
    event.currentTarget.style.setProperty("--pointer-x", "50%");
    event.currentTarget.style.setProperty("--pointer-y", "50%");
  };

  return (
    <article
      ref={cardRef}
      className={`project-card project-${project.visual} reveal`}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div className={`project-visual visual-${project.visual}`} aria-hidden="true">
        <ProjectImage className="project-image" src={project.image} alt="" sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 600px" />
        <span className="project-image-overlay" />
        <span className="visual-index">PROJECT / {project.number}</span>
        {project.visual === "game" && <div className="visual-game-orbit"><span /><i /><b /></div>}
        {project.visual === "database" && <div className="visual-database"><span /><span /><span /><span /></div>}
        {project.visual === "archive" && <div className="visual-archive"><i>2</i><i>BAC</i><span>ARCHIVE<br />COMMUNITY<br />COLLECTION</span></div>}
        {project.visual === "network" && <div className="visual-nodes">{Array.from({ length: 9 }, (_, index) => <i key={index} />)}</div>}
        <span className="visual-category">{project.category}</span>
      </div>
      <div className="project-info">
        <div className="project-title-line"><span className="project-number">{project.number}</span><h3>{project.title}</h3></div>
        <p>{project.description}</p>
        <div className="project-stack">{project.stack.map((item) => <span key={item}>{item}</span>)}</div>
        {project.repo && (
          <a className="project-link" href={`https://github.com/ahmedbouramdane/${project.repo}`} target="_blank" rel="noreferrer" aria-label={`View ${project.title} on GitHub`}>View repository <MoveUpRight size={16} /></a>
        )}
      </div>
    </article>
  );
}

export default function Portfolio() {
  const root = useRef<HTMLElement>(null);
  const yearRef = useRef<HTMLTimeElement>(null);
  const contactFormRef = useRef<HTMLFormElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [projectFilter, setProjectFilter] = useState("All");
  const [portfolioProjects, setPortfolioProjects] = useState(projects);
  const [portfolioCertificates, setPortfolioCertificates] = useState(certificates);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [contactResult, setContactResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [emailCopied, setEmailCopied] = useState(false);
  const categories = ["All", ...Array.from(new Set(portfolioProjects.map((project) => project.category)))];
  const visibleProjects = portfolioProjects.filter((project) => projectFilter === "All" || project.category === projectFilter);
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "a.bouramdnae.se24@lydex-se.ma";

  useEffect(() => {
    let active = true;
    void fetch("/api/projects", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Project feed returned ${response.status}.`);
        const payload: unknown = await response.json();
        if (!Array.isArray(payload) || !payload.every(isPortfolioProject)) {
          throw new Error("Project feed returned invalid project data.");
        }
        if (active) {
          setPortfolioProjects(payload.map((project, index) => ({
            ...project,
            number: String(index + 1).padStart(2, "0"),
          })));
        }
      })
      .catch((error: unknown) => {
        console.error("Could not load the latest portfolio projects; showing the built-in project list.", error);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void fetch("/api/certificates", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Certificate feed returned ${response.status}.`);
        const payload: unknown = await response.json();
        if (!Array.isArray(payload) || !payload.every(isPortfolioCertificate)) {
          throw new Error("Certificate feed returned invalid certificate data.");
        }
        if (active) setPortfolioCertificates(payload);
      })
      .catch((error: unknown) => {
        console.error("Could not load the latest portfolio certificates; showing the built-in certificate list.", error);
      });
    return () => {
      active = false;
    };
  }, []);

  const submitContactForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSendingMessage) return;

    const formData = new FormData(event.currentTarget);
    const submission = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      subject: String(formData.get("subject") ?? ""),
      message: String(formData.get("message") ?? ""),
      consent: formData.get("consent") === "on",
      company_website: String(formData.get("company_website") ?? ""),
    };

    setIsSendingMessage(true);
    setContactResult(null);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission),
      });
      const result: unknown = await response.json();
      const detail =
        typeof result === "object" && result !== null && "detail" in result
          ? result.detail
          : undefined;

      if (!response.ok) {
        const message = typeof detail === "string"
          ? detail
          : "Please check the form details and try again.";
        throw new Error(message);
      }

      setContactResult({
        type: "success",
        message: typeof detail === "string" ? detail : "Your message has been received.",
      });
      contactFormRef.current?.reset();
    } catch (error) {
      console.error("Could not submit the portfolio contact form", error);
      setContactResult({
        type: "error",
        message: error instanceof Error ? error.message : "The message could not be sent. Please use a direct contact link.",
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  const copyContactEmail = async () => {
    try {
      await navigator.clipboard.writeText(contactEmail);
      setEmailCopied(true);
    } catch (error) {
      console.error("Could not copy the contact email address", error);
      setContactResult({
        type: "error",
        message: "Couldn’t copy the email address. Use the email link to contact me directly.",
      });
    }
  };

  useEffect(() => {
    if (yearRef.current) yearRef.current.textContent = String(new Date().getFullYear());
    let isTransitioningToAbout = false;
    let hasEnteredAbout = false;
    let snapInterrupted = false;
    let snapHeroToAbout = () => {};
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
      const snapThreshold = Math.min(160, window.innerHeight * 0.2);
      if (window.scrollY < 2 && !isTransitioningToAbout) {
        hasEnteredAbout = false;
        snapInterrupted = false;
      } else if (snapInterrupted && window.scrollY > snapThreshold) {
        snapInterrupted = false;
        hasEnteredAbout = true;
      }
      snapHeroToAbout();
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const context = gsap.context(() => {
      if (!reduceMotion) {
        gsap.from(".hero-title-line, .hero-description, .hero-actions", {
          y: 24,
          opacity: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          delay: 0.15,
        });
        gsap.utils.toArray<HTMLElement>(".reveal").forEach((element) => {
          gsap.fromTo(element, { y: 30, opacity: 0 }, {
            y: 0,
            opacity: 1,
            duration: 0.75,
            ease: "power2.out",
            scrollTrigger: { trigger: element, start: "top 88%", once: true },
          });
        });
        gsap.fromTo(".about-reveal-item", { y: 22, opacity: 0 }, {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.13,
          ease: "power2.out",
          scrollTrigger: { trigger: ".about-story", start: "top 82%", once: true },
        });
        gsap.fromTo(".about-portrait-image", { scale: 0.94, opacity: 0.7 }, {
          scale: 1,
          opacity: 1,
          duration: 1.1,
          ease: "power2.out",
          clearProps: "transform,opacity",
          scrollTrigger: { trigger: ".about-portrait", start: "top 82%", once: true },
        });
        gsap.fromTo(".about-interest-card", { y: 14, opacity: 0 }, {
          y: 0,
          opacity: 1,
          duration: 0.62,
          stagger: 0.12,
          ease: "power3.out",
          clearProps: "transform,opacity",
          scrollTrigger: { trigger: ".about-interest-card:first-child", start: "top 88%", once: true },
        });
      }
    }, root);

    const hero = root.current?.querySelector<HTMLElement>(".hero");
    const heroArt = hero?.querySelector<HTMLElement>(".hero-art");
    const codeMotifs = gsap.utils.toArray<HTMLElement>(".hero-code-float");
    const hoverPointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const motifX = codeMotifs.map((element) => gsap.quickTo(element, "x", { duration: 0.8, ease: "power3.out" }));
    const motifY = codeMotifs.map((element) => gsap.quickTo(element, "y", { duration: 0.8, ease: "power3.out" }));
    const handleHeroPointerMove = (event: PointerEvent) => {
      if (!heroArt || reduceMotion || !hoverPointer.matches) return;
      const bounds = heroArt.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;
      heroArt.style.setProperty("--hero-pointer-x", `${Math.max(0, Math.min(1, x)) * 100}%`);
      heroArt.style.setProperty("--hero-pointer-y", `${Math.max(0, Math.min(1, y)) * 100}%`);
      codeMotifs.forEach((element, index) => {
        const depth = Number(element.dataset.depth) || 12;
        motifX[index](Math.max(-1, Math.min(1, x - 0.5)) * depth);
        motifY[index](Math.max(-1, Math.min(1, y - 0.5)) * depth);
      });
    };
    const resetHeroPointer = () => {
      codeMotifs.forEach((_, index) => {
        motifX[index](0);
        motifY[index](0);
      });
      heroArt?.style.setProperty("--hero-pointer-x", "50%");
      heroArt?.style.setProperty("--hero-pointer-y", "50%");
    };
    heroArt?.addEventListener("pointermove", handleHeroPointerMove);
    heroArt?.addEventListener("pointerleave", resetHeroPointer);

    const aboutSection = root.current?.querySelector<HTMLElement>("#about");
    const scrollRoot = document.documentElement;
    const previousScrollBehavior = scrollRoot.style.scrollBehavior;
    let scrollTween: gsap.core.Tween | null = null;
    const restoreScrollBehavior = () => {
      scrollRoot.style.scrollBehavior = previousScrollBehavior;
      isTransitioningToAbout = false;
      scrollTween = null;
    };
    const transitionToAbout = () => {
      if (!aboutSection || hasEnteredAbout || reduceMotion) return;
      hasEnteredAbout = true;
      isTransitioningToAbout = true;
      scrollRoot.style.scrollBehavior = "auto";
      const aboutTop = aboutSection.getBoundingClientRect().top + window.scrollY;
      scrollTween = gsap.to(window, {
        duration: 0.75,
        ease: "power2.inOut",
        scrollTo: {
          y: aboutTop,
          autoKill: true,
        },
        onComplete: () => {
          window.scrollTo(0, aboutSection.getBoundingClientRect().top + window.scrollY);
          restoreScrollBehavior();
        },
        onInterrupt: () => {
          restoreScrollBehavior();
          hasEnteredAbout = false;
          snapInterrupted = true;
        },
      });
    };
    snapHeroToAbout = () => {
      const snapThreshold = Math.min(160, window.innerHeight * 0.2);
      if (!reduceMotion && !snapInterrupted && !isTransitioningToAbout && !hasEnteredAbout && window.scrollY > 2 && window.scrollY <= snapThreshold) {
        transitionToAbout();
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: "-25% 0px -60% 0px", threshold: [0, 0.15, 0.4] },
    );
    root.current?.querySelectorAll<HTMLElement>(":scope > section[id]").forEach((section) => observer.observe(section));

    return () => {
      window.removeEventListener("scroll", handleScroll);
      heroArt?.removeEventListener("pointermove", handleHeroPointerMove);
      heroArt?.removeEventListener("pointerleave", resetHeroPointer);
      scrollTween?.kill();
      scrollRoot.style.scrollBehavior = previousScrollBehavior;
      observer.disconnect();
      context.revert();
    };
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <main ref={root}>
      <a className="skip-link" href="#about">Skip to main content</a>
      <header className={`site-header${isScrolled ? " is-scrolled" : ""}${menuOpen ? " menu-open" : ""}`} onKeyDown={(event) => { if (event.key === "Escape") closeMenu(); }}>
        <a className="brand" href="#home" aria-label="Ahmed Bouramdane — home" onClick={closeMenu}>
          <span className="brand-logo-frame">
            <Image className="brand-logo" src="/logo.png" alt="" width={512} height={512} />
          </span>
          <span className="brand-copy">
            <span className="brand-name">Ahmed BOURAMDANE</span>
            <span className="brand-caption">Software · AI · Creative Technology</span>
          </span>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map((link) => (
            <a className={activeSection === link.href.slice(1) ? "active" : ""} aria-current={activeSection === link.href.slice(1) ? "location" : undefined} href={link.href} key={link.href}>{link.label}</a>
          ))}
        </nav>
        <a className="header-social" href="https://github.com/ahmedbouramdane" target="_blank" rel="noreferrer" aria-label="GitHub profile">
          <Github size={17} strokeWidth={1.7} />
        </a>
        <button className="menu-button" type="button" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={menuOpen}>
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {links.map((link, index) => (
            <a className={activeSection === link.href.slice(1) ? "active" : ""} aria-current={activeSection === link.href.slice(1) ? "location" : undefined} href={link.href} key={link.href} onClick={closeMenu}><span>0{index + 1}</span>{link.label}<ArrowUpRight size={17} /></a>
          ))}
          <a className="mobile-github" href="https://github.com/ahmedbouramdane" target="_blank" rel="noreferrer"><Github size={17} /> GitHub</a>
        </nav>
      </header>

      <section className="hero section-shell" id="home" aria-labelledby="hero-heading">
        <div className="hero-copy">
          <p className="hero-name">Ahmed Bouramdane</p>
          <h1 id="hero-heading" className="hero-title">
            <span className="hero-title-line">Web, mobile</span>
            <span className="hero-title-line">&amp; <span className="title-accent">AI</span></span>
            <span className="hero-title-line">developer<span className="title-period">.</span></span>
          </h1>
          <p className="hero-description">I build web and mobile apps with Dart, Flutter, Firebase, React Native, and Android Studio, and explore AI.</p>
          <div className="hero-meta"><span>2 BAC SCIENCES MATHÉMATIQUES</span><i /><span>RABAT, MOROCCO</span></div>
          <div className="hero-actions">
            <a className="button button-primary" href="#projects">Explore my work <ArrowDownRight size={17} /></a>
            <a className="button button-text" href="#contact">Get in touch <ArrowRight size={16} /></a>
          </div>
        </div>
        <div className="hero-art">
          <div className="hero-code-field" aria-hidden="true">
            <span className="hero-code-float hero-code-float-python" data-depth="13"><span className="hero-code-symbol"><SiPython size={22} /><i>python</i></span></span>
            <span className="hero-code-float hero-code-float-react" data-depth="19"><span className="hero-code-symbol"><SiReact size={23} /><i>react</i></span></span>
            <span className="hero-code-float hero-code-float-js" data-depth="10"><span className="hero-code-symbol"><SiJavascript size={22} /><i>javascript</i></span></span>
            <span className="hero-code-float hero-code-float-dart" data-depth="16"><span className="hero-code-symbol"><SiDart size={22} /><i>flutter</i></span></span>
            <span className="hero-code-float hero-code-float-code" data-depth="24"><span className="hero-code-symbol"><Code2 size={21} /><i>&lt;build /&gt;</i></span></span>
            <span className="hero-code-float hero-code-float-next" data-depth="14"><span className="hero-code-symbol"><SiNextdotjs size={21} /><i>next.js</i></span></span>
            <span className="hero-code-float hero-code-float-typescript" data-depth="18"><span className="hero-code-symbol"><SiTypescript size={21} /><i>typescript</i></span></span>
            <span className="hero-code-float hero-code-float-tailwind" data-depth="11"><span className="hero-code-symbol"><SiTailwindcss size={21} /><i>tailwind</i></span></span>
            <span className="hero-code-float hero-code-float-docker" data-depth="17"><span className="hero-code-symbol"><SiDocker size={22} /><i>docker</i></span></span>
            <span className="hero-code-float hero-code-float-fastapi" data-depth="12"><span className="hero-code-symbol"><SiFastapi size={20} /><i>fastapi</i></span></span>
          </div>
          <div className="hero-ground" aria-hidden="true" />
          <div className="hero-portrait">
            <Image
              className="hero-portrait-image"
              src="/my-img1.png?v=20261107"
              alt="Portrait of Ahmed Bouramdane"
              width={1167}
              height={1348}
              sizes="(max-width: 760px) 87vw, 560px"
              unoptimized
              preload
            />
          </div>
        </div>
        <a className="scroll-cue" href="#about"><span>Scroll to explore</span><ArrowDown size={14} /></a>
      </section>

      <section className="about-section section-shell section-pad" id="about" aria-labelledby="about-heading">
        <div className="section-heading reveal">
          <Label>01 / PROFILE</Label>
          <span className="section-aside">2 BAC SCIENCES MATHÉMATIQUES</span>
        </div>
        <div className="about-layout">
          <figure className="about-portrait reveal">
            <Image
              src="/official-img-cutout.webp"
              alt="Ahmed Bouramdane"
              fill
              sizes="(max-width: 760px) 78vw, 360px"
              className="about-portrait-image"
            />
            <span className="about-portrait-glow" aria-hidden="true" />
            <span className="about-portrait-index"><span /> PROFILE / 2026</span>
            <span className="about-portrait-note">LEARNING<br />BY BUILDING</span>
            <figcaption><span className="about-status-dot" /> Sciences Mathématiques student <span>·</span> Rabat, Morocco</figcaption>
          </figure>
          <div className="about-story">
            <div className="about-intro about-reveal-item">
              <div className="about-title-row">
                <div>
                  <span className="about-kicker">A little about who I am</span>
                  <h2 id="about-heading" className="about-statement">About me<span aria-hidden="true">.</span></h2>
                </div>
                <span className="about-title-index">01<br /><i /> PROFILE</span>
              </div>
              <p className="about-lead">I’m Ahmed Bouramdane, a 2 BAC Sciences Mathématiques student at LYDEX de Rabat. I’ve been curious about coding since childhood, and I love exploring how software, mathematics, and AI can turn difficult questions into practical solutions.</p>
            </div>
            <div className="about-focus about-reveal-item">
              <div className="about-focus-heading">
                <span>THE THINGS THAT DRIVE ME</span>
                <span>03 AREAS</span>
              </div>
              <div className="about-interests" aria-label="Areas of interest">
                <article className="about-interest-card">
                  <div className="about-interest-card-top"><span className="about-interest-icon"><Code2 size={18} aria-hidden="true" /></span><span className="about-interest-index">01</span></div>
                  <h3>Software <span>&amp; web</span></h3>
                  <p>Turning thoughtful ideas into useful digital experiences.</p>
                </article>
                <article className="about-interest-card">
                  <div className="about-interest-card-top"><span className="about-interest-icon"><BrainCircuit size={18} aria-hidden="true" /></span><span className="about-interest-index">02</span></div>
                  <h3>AI <span>&amp; mathematics</span></h3>
                  <p>Finding patterns and exploring how intelligent systems work.</p>
                </article>
                <article className="about-interest-card">
                  <div className="about-interest-card-top"><span className="about-interest-icon"><Gamepad2 size={18} aria-hidden="true" /></span><span className="about-interest-index">03</span></div>
                  <h3>Robotics <span>&amp; creative tech</span></h3>
                  <p>Learning through hands-on experiments and playful technology.</p>
                </article>
              </div>
            </div>
            <div className="about-story-footer about-reveal-item">
              <p><span className="about-footer-mark" aria-hidden="true">↗</span><span>I’m working toward becoming a computer scientist and AI engineer, creating technology that makes a meaningful difference.</span></p>
              <a className="inline-link" href="https://github.com/ahmedbouramdane" target="_blank" rel="noreferrer">Explore my projects <MoveUpRight size={15} /></a>
            </div>
          </div>
        </div>
      </section>

      <section
        className="w-full border-y border-[#e4d8c5] bg-[#f4ead6] py-16 sm:py-20 lg:py-24"
        id="expertise"
        aria-labelledby="expertise-heading"
      >
        <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-8 lg:px-12 xl:px-16">
          <div className="reveal flex flex-col gap-4 pb-8 pt-2 sm:pb-10 lg:pb-12">
            <h2
              id="expertise-heading"
              className="m-0 font-[var(--font-display)] text-[clamp(2.7rem,6vw,5.25rem)] font-medium leading-[1.02] tracking-[-0.065em] text-[#30271d]"
            >
              Technologies I <span className="text-[#bd572b]">use.</span>
            </h2>
          </div>
          <TechnologyCarousel />
        </div>
      </section>

      <section className="certificate-section section-shell section-pad" id="certificates" aria-labelledby="certificates-heading">
        <div className="section-heading reveal">
          <Label>02 / Verified learning</Label>
          <span className="section-aside">VERIFIED CREDENTIALS</span>
        </div>
        <div className="certificate-intro reveal">
          <div>
            <h2 id="certificates-heading">Knowledge,<br /><span>put to the test.</span></h2>
          </div>
          <p>Credentials earned through practical assessments and recognized learning programs.</p>
        </div>
        <CertificateCarousel certificates={portfolioCertificates} />
        <p className="certificate-note reveal"><span>{String(portfolioCertificates.length).padStart(2, "0")}</span> credentials displayed <i /> Each image opens at full resolution.</p>
      </section>

      <section className="projects-section section-shell section-pad" id="projects" aria-labelledby="projects-heading">
        <div className="projects-intro reveal">
          <div><Label>03 / Selected work</Label><h2 id="projects-heading">Selected projects.</h2></div>
          <p>Experiments and tools built to solve problems, learn deeply, and turn ideas into working software.</p>
        </div>
        <div className="project-filters" aria-label="Filter projects">
          {categories.map((category) => (
            <button type="button" key={category} className={projectFilter === category ? "selected" : ""} onClick={() => setProjectFilter(category)} aria-pressed={projectFilter === category}>{category}</button>
          ))}
        </div>
        <div className="project-grid" aria-live="polite">
          {visibleProjects.map((project) => (
            <ProjectCard project={project} key={project.id} />
          ))}
        </div>
        <p className="project-note reveal">{String(visibleProjects.length).padStart(2, "0")} projects shown <span>·</span> Filter by area to explore the work.</p>
      </section>

      <section className="journey-section section-shell section-pad" id="journey" aria-labelledby="journey-heading">
        <div className="section-heading reveal">
          <Label>04 / THE LEARNING JOURNEY</Label>
          <span className="section-aside">STUDIES &amp; PROJECTS</span>
        </div>
        <div className="journey-layout">
          <div className="journey-intro reveal">
            <h2 id="journey-heading">Studies and<br /><span>independent projects.</span></h2>
            <p>A path shaped by an early curiosity for coding, learning on my own, and getting involved in the school clubs I care about.</p>
          </div>
          <div className="timeline">
            <article className="timeline-entry reveal">
              <div className="timeline-marker" aria-hidden="true">01</div>
              <div className="timeline-content">
                <div className="timeline-card-heading"><span className="timeline-label">SELF-TAUGHT</span><span className="timeline-meta">SINCE CHILDHOOD</span></div>
                <h3>A curiosity for coding</h3>
                <p>I’ve been drawn to coding since childhood. I keep building on that curiosity through self-directed learning, exploring new tools, and turning what I learn into small experiments.</p>
              </div>
            </article>
            <article className="timeline-entry reveal">
              <div className="timeline-marker" aria-hidden="true">02</div>
              <div className="timeline-content">
                <div className="timeline-card-heading"><span className="timeline-label">HIGH SCHOOL</span><span className="timeline-meta">RABAT, MOROCCO</span></div>
                <h3>2 BAC Sciences Mathématiques at LYDEX</h3>
                <p>I’m studying the Sciences Mathématiques track (2 BAC SM) at LYDEX de Rabat. Outside class, I’m active in the programming, robotics, and organization clubs.</p>
                <div className="timeline-tags" aria-label="LYDEX club activities"><span>Programming</span><span>Robotics</span><span>Organization</span></div>
              </div>
            </article>
            <article className="timeline-entry reveal">
              <div className="timeline-marker" aria-hidden="true">03</div>
              <div className="timeline-content">
                <div className="timeline-card-heading"><span className="timeline-label">INDEPENDENT PROJECTS</span><span className="timeline-meta">ONGOING</span></div>
                <h3>Learning by making</h3>
                <p>I apply what I learn to personal projects across software, data, AI, and interactive experiences—building practical skills one idea at a time.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="contact-section section-shell" id="contact" aria-labelledby="contact-heading">
        <div className="contact-topline reveal"><Label>05 / Contact</Label><span className="section-aside">RABAT, MOROCCO</span></div>
        <div className="contact-layout">
          <div className="contact-content reveal">
            <span className="contact-overline">Available for <span>opportunities.</span></span>
            <h2 id="contact-heading">Let’s work on<br /><span>a project.</span></h2>
            <p>I’m interested in internships, freelance work, open-source contributions, and technical collaborations. Send a note or reach out through your preferred channel.</p>
            <div className="contact-channels" aria-label="Direct contact options">
              <a className="contact-channel contact-channel-email" href={`mailto:${contactEmail}`}>
                <span className="contact-channel-icon"><Mail size={18} aria-hidden="true" /></span>
                <span><strong>Email</strong><small>{contactEmail}</small></span>
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
              <a className="contact-channel contact-channel-whatsapp" href="https://wa.me/212633977491" target="_blank" rel="noreferrer">
                <span className="contact-channel-icon"><WhatsApp size={18} aria-hidden="true" /></span>
                <span><strong>WhatsApp</strong><small>+212 633 977 491</small></span>
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
              <a className="contact-channel" href="https://linkedin.com/in/ahmedbouramdane" target="_blank" rel="noreferrer">
                <span className="contact-channel-icon"><Linkedin size={18} aria-hidden="true" /></span>
                <span><strong>LinkedIn</strong><small>Professional profile</small></span>
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
              <a className="contact-channel" href="https://github.com/ahmedbouramdane" target="_blank" rel="noreferrer">
                <span className="contact-channel-icon"><Github size={18} aria-hidden="true" /></span>
                <span><strong>GitHub</strong><small>Projects and code</small></span>
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
              <a className="contact-channel" href="https://instagram.com/ahmedbouramdane77" target="_blank" rel="noreferrer">
                <span className="contact-channel-icon"><Instagram size={18} aria-hidden="true" /></span>
                <span><strong>Instagram</strong><small>Follow along</small></span>
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
            </div>
            <button className="contact-copy-email" type="button" onClick={() => void copyContactEmail()}>
              {emailCopied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
              {emailCopied ? "Email copied" : "Copy email address"}
            </button>
          </div>

          <form className="contact-form reveal" ref={contactFormRef} onSubmit={submitContactForm}>
            <div className="contact-form-heading">
              <span>START A CONVERSATION</span>
              <strong>Send me a message</strong>
            </div>
            <div className="contact-form-fields">
              <label className="contact-field">
                <span>Your name</span>
                <input name="name" type="text" autoComplete="name" minLength={2} maxLength={100} placeholder="Jane Smith" required />
              </label>
              <label className="contact-field">
                <span>Email address</span>
                <input name="email" type="email" autoComplete="email" maxLength={254} placeholder="jane@example.com" required />
              </label>
              <label className="contact-field contact-field-full">
                <span>What is this about?</span>
                <select name="subject" defaultValue="" required>
                  <option value="" disabled>Choose a topic</option>
                  <option value="Internship opportunity">Internship opportunity</option>
                  <option value="Freelance project">Freelance project</option>
                  <option value="Collaboration">Collaboration</option>
                  <option value="Something else">Something else</option>
                </select>
              </label>
              <label className="contact-field contact-field-full">
                <span>Your message</span>
                <textarea name="message" rows={5} minLength={10} maxLength={5000} placeholder="Tell me a little about your idea..." required />
              </label>
            </div>
            <div className="contact-honeypot" aria-hidden="true">
              <label htmlFor="company-website">Leave this field empty</label>
              <input id="company-website" name="company_website" type="text" tabIndex={-1} autoComplete="off" />
            </div>
            <label className="contact-consent">
              <input name="consent" type="checkbox" required />
              <span>I agree that my details can be stored to respond to this message. Please don’t include sensitive information.</span>
            </label>
            {contactResult && (
              <p className={`contact-form-result ${contactResult.type}`} role={contactResult.type === "error" ? "alert" : "status"}>
                {contactResult.message}
              </p>
            )}
            <button className="contact-submit" type="submit" disabled={isSendingMessage}>
              {isSendingMessage ? "Sending..." : "Send message"} <Send size={16} aria-hidden="true" />
            </button>
            <p className="contact-form-footnote">Messages are stored in the contact database only so I can reply.</p>
          </form>
        </div>
        <div className="contact-orbit" aria-hidden="true"><span /><span /><span /></div>
      </section>

      <footer className="site-footer section-shell">
        <a className="footer-brand" href="#home">Ahmed Bouramdane<span>.</span></a>
        <span className="footer-location">Rabat, Morocco <span>—</span> <time ref={yearRef} /></span>
        <div className="footer-links">
          <a href="https://github.com/ahmedbouramdane" target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={13} /></a>
          <a href="https://linkedin.com/in/ahmedbouramdane" target="_blank" rel="noreferrer">LinkedIn <ArrowUpRight size={13} /></a>
          <a href="https://instagram.com/ahmedbouramdane77" target="_blank" rel="noreferrer">Instagram <ArrowUpRight size={13} /></a>
          <a className="back-top" href="#home" aria-label="Return to top"><ArrowDown size={15} /></a>
        </div>
      </footer>
    </main>
  );
}
