"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowDownRight, ArrowRight, ArrowUpRight, BrainCircuit, ChartNoAxesColumn, Code2, Database, Gamepad2, GitBranch, Menu, MoveUpRight, X, type LucideIcon } from "lucide-react";
import { FaGithub as Github, FaLinkedin as Linkedin } from "react-icons/fa6";
import type { IconType } from "react-icons";
import {
  SiArduino,
  SiBlender,
  SiBootstrap,
  SiDocker,
  SiDjango,
  SiExpress,
  SiFastapi,
  SiFlask,
  SiGit,
  SiGithub,
  SiGithubactions,
  SiGodotengine,
  SiHuggingface,
  SiJavascript,
  SiKubernetes,
  SiLangchain,
  SiLaravel,
  SiLinux,
  SiMongodb,
  SiMysql,
  SiNextdotjs,
  SiNumpy,
  SiOpencv,
  SiPandas,
  SiPostgresql,
  SiPytorch,
  SiPython,
  SiReact,
  SiScikitlearn,
  SiSqlite,
  SiTailwindcss,
  SiThreedotjs,
  SiTypescript,
} from "react-icons/si";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const links = [
  { label: "About", href: "#about" },
  { label: "Expertise", href: "#expertise" },
  { label: "Projects", href: "#projects" },
  { label: "Journey", href: "#journey" },
  { label: "Contact", href: "#contact" },
];

const projects = [
  {
    number: "01",
    title: "3D Game / Arduino",
    category: "Interactive",
    description:
      "A browser-based 3D game paired with a physical joystick. Three.js renders the experience while an Arduino Uno sends joystick and button input over serial.",
    stack: ["Three.js", "Arduino", "JavaScript"],
    repo: "3D-Game-Arduino",
    visual: "game",
  },
  {
    number: "02",
    title: "Students Management System",
    category: "Backend",
    description:
      "A FastAPI and SQLAlchemy student record app with registration, student listing, editing, deletion, and a basic analysis view. PostgreSQL is configured as its database.",
    stack: ["FastAPI", "SQLAlchemy", "PostgreSQL"],
    repo: "Students_management_system_FastAPI",
    visual: "database",
  },
  {
    number: "03",
    title: "2BAC Archive",
    category: "Web",
    description:
      "A web archive project focused on collecting and preserving historical documents, images, and other materials connected to the 2 BAC community.",
    stack: ["HTML", "Web"],
    repo: "2BAC-Archive-Web",
    visual: "archive",
  },
  {
    number: "04",
    title: "LLM & Vector Databases",
    category: "AI & Data",
    description:
      "A compact learning repository introducing large language models, vector databases such as Chroma, and embedding models. A starting point for hands-on exploration.",
    stack: ["Python", "LLMs", "Chroma"],
    repo: "LLM_VectorDBs",
    visual: "network",
  },
];

const skillPaths = [
  {
    number: "01",
    name: "Software engineering",
    description: "Building the interfaces, APIs, and foundations behind web applications.",
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
    description: "Analyzing data and learning how machine-learning systems are built.",
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
    name: "Interactive media",
    description: "Creating realtime graphics and connecting software to physical controls.",
    icon: Gamepad2,
    groups: [
      { name: "3D & graphics", tools: ["Three.js", "Blender"] },
      { name: "Game development", tools: ["Godot", "GDScript"] },
      { name: "Physical computing", tools: ["Arduino"] },
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
};

function Label({ children }: { children: ReactNode }) {
  return <span className="eyebrow"><span className="eyebrow-dot" />{children}</span>;
}

function Playground() {
  const [frequency, setFrequency] = useState(6);
  const [isMoving, setIsMoving] = useState(true);
  const points = Array.from({ length: 90 }, (_, index) => {
    const progress = index / 89;
    const angle = progress * Math.PI * 2;
    const radius = 94 + Math.sin(angle * frequency) * 18;
    return `${(180 + Math.cos(angle) * radius).toFixed(2)},${(150 + Math.sin(angle) * radius * 0.62).toFixed(2)}`;
  });

  return (
    <div className={`playground-visual${isMoving ? " is-moving" : ""}`}>
      <svg className="playground-svg" viewBox="0 0 360 300" role="img" aria-label={`A generative curve with ${frequency} oscillations`}>
        <defs>
          <radialGradient id="orbit-glow">
            <stop offset="0" stopColor="#f2bd55" stopOpacity=".28" />
            <stop offset="1" stopColor="#e28a3e" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="180" cy="150" r="116" fill="url(#orbit-glow)" />
        <circle className="orbit-ring orbit-ring-outer" cx="180" cy="150" r="110" />
        <circle className="orbit-ring orbit-ring-inner" cx="180" cy="150" r="72" />
        <polyline className="orbit-path orbit-path-back" points={points.join(" ")} transform="rotate(60 180 150)" />
        <polyline className="orbit-path" points={points.join(" ")} />
        <circle className="orbit-core" cx="180" cy="150" r="5" />
      </svg>
      <div className="playground-coordinate coordinate-top">ƒ(x) = sin({frequency}θ)</div>
      <div className="playground-coordinate coordinate-bottom">PARAMETRIC / 2D</div>
      <div className="playground-controls">
        <label htmlFor="frequency">Frequency <span>{frequency.toString().padStart(2, "0")}</span></label>
        <input id="frequency" type="range" min="2" max="12" value={frequency} onChange={(event) => setFrequency(Number(event.target.value))} />
        <button type="button" className="motion-toggle" onClick={() => setIsMoving((moving) => !moving)} aria-pressed={!isMoving}>
          <span className={`toggle-indicator${isMoving ? " active" : ""}`} />
          {isMoving ? "Motion on" : "Motion paused"}
        </button>
      </div>
    </div>
  );
}

export default function Portfolio() {
  const root = useRef<HTMLElement>(null);
  const yearRef = useRef<HTMLTimeElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [projectFilter, setProjectFilter] = useState("All");
  const categories = ["All", ...Array.from(new Set(projects.map((project) => project.category)))];
  const visibleProjects = projects.filter((project) => projectFilter === "All" || project.category === projectFilter);
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

  useEffect(() => {
    if (yearRef.current) yearRef.current.textContent = String(new Date().getFullYear());
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
      }
    }, root);

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
          <div className="hero-actions">
            <a className="button button-primary" href="#projects">Explore my work <ArrowDownRight size={17} /></a>
            <a className="button button-text" href="#contact">Get in touch <ArrowRight size={16} /></a>
          </div>
        </div>
        <div className="hero-art">
          <div className="hero-ground" aria-hidden="true" />
          <div className="hero-portrait">
            <Image
              className="hero-portrait-image"
              src="/my-img1.png"
              alt="Portrait of Ahmed Bouramdane"
              width={592}
              height={592}
              sizes="(max-width: 760px) 87vw, 560px"
              preload
            />
          </div>
        </div>
        <a className="scroll-cue" href="#about"><span>Scroll to explore</span><ArrowDown size={14} /></a>
      </section>

      <section className="about-section section-shell section-pad" id="about" aria-labelledby="about-heading">
        <div className="section-heading reveal">
          <Label>01 / A little about me</Label>
          <span className="section-aside">COMPUTER SCIENCE STUDENT</span>
        </div>
        <div className="about-grid">
          <h2 id="about-heading" className="about-statement reveal">Computer science,<br /><span>put into practice.</span></h2>
          <div className="about-copy reveal">
            <p>I study computer science at LYDEX de Rabat, where I’m developing a foundation in programming, mathematics, and software design.</p>
            <p>I build web applications and work on projects involving data analysis, AI, and interactive graphics. I’m also interested in game development and contributing to open-source software.</p>
            <a className="inline-link" href="https://github.com/ahmedbouramdane" target="_blank" rel="noreferrer">View my work on GitHub <MoveUpRight size={15} /></a>
          </div>
        </div>
        <div className="about-foot reveal">
          <div className="about-foot-item"><span className="foot-index">A</span><span>Software engineering</span></div>
          <div className="about-foot-item"><span className="foot-index">B</span><span>AI &amp; data analysis</span></div>
          <div className="about-foot-item"><span className="foot-index">C</span><span>Interactive graphics</span></div>
        </div>
      </section>

      <section
        className="w-full border-y border-[#e4d8c5] bg-[#f4ead6] py-16 sm:py-20 lg:py-24"
        id="expertise"
        aria-labelledby="expertise-heading"
      >
        <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-8 lg:px-12 xl:px-16">
          <div className="reveal flex flex-col gap-5 pb-9 pt-2 sm:pb-12 lg:pb-14">
            <h2
              id="expertise-heading"
              className="m-0 font-[var(--font-display)] text-[clamp(2.7rem,6vw,5.25rem)] font-medium leading-[1.02] tracking-[-0.065em] text-[#30271d]"
            >
              Technologies I <span className="text-[#bd572b]">use.</span>
            </h2>
          </div>

          <nav className="reveal mb-6 flex flex-wrap gap-2.5" aria-label="Technology paths">
            {skillPaths.map((path) => (
              <a
                className="group inline-flex min-h-10 items-center gap-2.5 rounded-full border border-[#ddcdb5] bg-[#fffaf0] px-3.5 text-[11px] font-medium text-[#554733] transition-colors hover:border-[#c96b3b] hover:bg-white hover:text-[#a84423] sm:px-4"
                href={`#path-${path.number}`}
                key={path.number}
              >
                <span className="font-[var(--font-mono)] text-[9px] text-[#bd572b]">{path.number}</span>
                {path.name}
                <ArrowDown size={13} className="text-[#9b8260] transition-transform group-hover:translate-y-0.5" aria-hidden="true" />
              </a>
            ))}
          </nav>

          <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {skillPaths.map((path) => (
              <article
                className="reveal scroll-mt-24 rounded-xl border border-[#e4d5bd] bg-[#fffaf0] p-5 shadow-[0_5px_18px_rgba(98,70,34,0.035)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-1 hover:border-[#d29a6b] hover:shadow-[0_12px_28px_rgba(98,70,34,0.08)] sm:p-6"
                id={`path-${path.number}`}
                key={path.number}
              >
                <div className="flex items-start gap-3.5 border-b border-[#eadfce] pb-5">
                  <span className={`grid size-11 shrink-0 place-items-center rounded-lg border border-[#e8d8bf] ${path.number === "02" ? "bg-[#f7efcf] text-[#9d6a1d]" : path.number === "03" ? "bg-[#f8e9d8] text-[#b34b30]" : "bg-[#faedda] text-[#b94d25]"}`}>
                    <path.icon size={21} strokeWidth={1.7} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 font-[var(--font-mono)] text-[9px] tracking-[0.12em] text-[#947f60]">
                      PATH / {path.number}
                    </div>
                    <h3 className="m-0 font-[var(--font-display)] text-lg font-medium leading-snug tracking-[-0.03em] text-[#30271d] sm:text-xl">
                      {path.name}
                    </h3>
                    <p className="mb-0 mt-2 text-[11px] leading-[1.7] text-[#756853]">
                      {path.description}
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-[#eadfce]">
                  {path.groups.map((group) => (
                    <section className="py-4 first:pt-5 last:pb-1" key={group.name} aria-label={group.name}>
                      <h4 className="mb-2.5 mt-0 font-[var(--font-mono)] text-[9px] font-medium uppercase tracking-[0.1em] text-[#a4512c]">
                        {group.name}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {group.tools.map((tool) => {
                          const BrandIcon = skillIcons[tool];
                          const ConceptIcon = skillConceptIcons[tool];
                          return (
                            <span
                              className="inline-flex min-h-8 items-center gap-2 rounded-md border border-[#e9dfcf] bg-white/80 px-2.5 py-1.5 font-[var(--font-mono)] text-[10px] leading-tight text-[#554733] transition-colors hover:border-[#d7a27b] hover:bg-[#fff5e3]"
                              key={tool}
                            >
                              {BrandIcon ? (
                                <BrandIcon size={15} color={skillIconColors[tool]} aria-hidden="true" />
                              ) : ConceptIcon ? (
                                <ConceptIcon size={14} className="shrink-0 text-[#b95b32]" aria-hidden="true" />
                              ) : null}
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
      </section>

      <section className="projects-section section-shell section-pad" id="projects" aria-labelledby="projects-heading">
        <div className="projects-intro reveal">
          <h2 id="projects-heading">Selected projects.</h2>
        </div>
        <div className="project-filters" aria-label="Filter projects">
          {categories.map((category) => (
            <button type="button" key={category} className={projectFilter === category ? "selected" : ""} onClick={() => setProjectFilter(category)} aria-pressed={projectFilter === category}>{category}</button>
          ))}
        </div>
        <div className="project-grid">
          {visibleProjects.map((project) => (
            <article className={`project-card project-${project.visual} reveal`} key={project.number}>
              <div className={`project-visual visual-${project.visual}`} aria-hidden="true">
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
                <a className="project-link" href={`https://github.com/ahmedbouramdane/${project.repo}`} target="_blank" rel="noreferrer" aria-label={`View ${project.title} on GitHub`}>View repository <MoveUpRight size={16} /></a>
              </div>
            </article>
          ))}
        </div>
        <p className="project-note reveal">Descriptions reflect the public repository documentation; scope and implementation details may evolve.</p>
      </section>

      <section className="playground-section section-shell section-pad" id="playground" aria-labelledby="playground-heading">
        <div className="section-heading reveal">
          <Label>04 / Interactive demo</Label>
          <span className="section-aside">PARAMETRIC CURVE</span>
        </div>
        <div className="playground-layout">
          <div className="playground-copy reveal">
            <span className="experiment-tag">GENERATOR / 001</span>
            <h2 id="playground-heading">Explore a<br /><span>parametric curve.</span></h2>
            <p>This drawing uses a sine wave to change the radius of a point as it moves around a circle. Adjust the frequency to see how the curve changes.</p>
            <div className="experiment-math"><span>r(θ) = 94 + 18 sin(nθ)</span><span>0 ≤ θ ≤ 2π</span></div>
            <span className="experiment-caption">Adjust the frequency to change the shape.</span>
          </div>
          <div className="reveal"><Playground /></div>
        </div>
      </section>

      <section className="journey-section section-shell section-pad" id="journey" aria-labelledby="journey-heading">
        <div className="section-heading reveal">
          <Label>05 / The ongoing journey</Label>
          <span className="section-aside">STUDIES &amp; PROJECTS</span>
        </div>
        <div className="journey-layout">
          <div className="journey-intro reveal">
            <h2 id="journey-heading">Studies and<br /><span>independent projects.</span></h2>
            <p>My current studies and the areas I explore through personal projects.</p>
          </div>
          <div className="timeline">
            <article className="timeline-entry reveal">
              <div className="timeline-marker"><span /></div>
              <div className="timeline-content"><span className="timeline-label">EDUCATION</span><h3>Computer science at LYDEX</h3><p>Studying computer science at LYDEX de Rabat, with a focus on programming, mathematics, and problem-solving.</p><span className="timeline-meta">RABAT, MOROCCO</span></div>
            </article>
            <article className="timeline-entry reveal">
              <div className="timeline-marker"><span /></div>
              <div className="timeline-content"><span className="timeline-label">PERSONAL PROJECTS</span><h3>Software, data, and interactive graphics</h3><p>Exploring backend development, data analysis, language models, and interactive projects through independent work.</p><span className="timeline-meta">ONGOING</span></div>
            </article>
          </div>
        </div>
      </section>

      <section className="contact-section section-shell" id="contact" aria-labelledby="contact-heading">
        <div className="contact-topline reveal"><Label>06 / Contact</Label><span className="section-aside">RABAT, MOROCCO</span></div>
        <div className="contact-content reveal">
          <span className="contact-overline">Available for <span>opportunities.</span></span>
          <h2 id="contact-heading">Let’s work on<br /><span>a project.</span></h2>
          <p>I’m interested in internships, freelance work, open-source contributions, and technical collaborations.</p>
          <div className="contact-links">
            {contactEmail ? <a className="button button-primary" href={`mailto:${contactEmail}`}>Say hello <ArrowUpRight size={17} /></a> : <p className="email-note">Email isn’t configured yet — add <code>NEXT_PUBLIC_CONTACT_EMAIL</code> to enable direct email.</p>}
            <a className="contact-social" href="https://github.com/ahmedbouramdane" target="_blank" rel="noreferrer"><Github size={17} /> GitHub <ArrowUpRight size={14} /></a>
            <a className="contact-social" href="https://linkedin.com/in/ahmedbouramdane" target="_blank" rel="noreferrer"><Linkedin size={17} /> LinkedIn <ArrowUpRight size={14} /></a>
          </div>
        </div>
        <div className="contact-orbit" aria-hidden="true"><span /><span /><span /></div>
      </section>

      <footer className="site-footer section-shell">
        <a className="footer-brand" href="#home">Ahmed Bouramdane<span>.</span></a>
        <span className="footer-location">Rabat, Morocco <span>—</span> <time ref={yearRef} /></span>
        <div className="footer-links">
          <a href="https://github.com/ahmedbouramdane" target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={13} /></a>
          <a href="https://linkedin.com/in/ahmedbouramdane" target="_blank" rel="noreferrer">LinkedIn <ArrowUpRight size={13} /></a>
          <a className="back-top" href="#home" aria-label="Return to top"><ArrowDown size={15} /></a>
        </div>
      </footer>
    </main>
  );
}
