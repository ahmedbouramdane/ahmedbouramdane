"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from "react";
import { ArrowLeft, ArrowRight, FileText, Minus, Move, Plus, RotateCcw } from "lucide-react";

const pageCount = 2;
const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "a.bouramdnae.se24@lydex-se.ma";

const projects = [
  {
    name: "My Quiz Platform",
    detail: "An interactive quiz platform built to make practice and learning more engaging.",
  },
  {
    name: "3D Game / Arduino",
    detail: "A browser-based Three.js game controlled with an Arduino joystick and buttons.",
  },
  {
    name: "Students Management System",
    detail: "Student records and basic analysis with FastAPI, SQLAlchemy, and PostgreSQL.",
  },
  {
    name: "2BAC Archive",
    detail: "A web archive for collecting and preserving materials for the 2 BAC community.",
  },
  {
    name: "LLM & Vector Databases",
    detail: "A hands-on introduction to language models, embeddings, and Chroma.",
  },
];

const certifications = [
  { title: "Node.js (Intermediate)", issuer: "HackerRank", date: "04 Nov 2026" },
  { title: "SQL (Advanced)", issuer: "HackerRank", date: "31 Oct 2026" },
  { title: "Problem Solving (Intermediate)", issuer: "HackerRank", date: "04 Nov 2026" },
];

function SectionHeading({ number, children }: { number: string; children: ReactNode }) {
  return (
    <h2 className="mb-[1.4cqw] flex items-baseline gap-[1.5cqw] border-b border-neutral-200 pb-[1.1cqw] font-[var(--font-display)] text-[2.35cqw] font-semibold leading-none tracking-[-.025em] text-neutral-800">
      <span className="font-[var(--font-mono)] text-[1.65cqw] font-medium tracking-[.06em] text-neutral-400">{number}</span>
      {children}
    </h2>
  );
}

function PageMasthead({ page }: { page: number }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-neutral-200 pb-[2.2cqw] font-[var(--font-mono)] text-[1.35cqw] font-medium tracking-[.12em] text-neutral-500">
      <span>AHMED BOURAMDANE</span>
      <span>{page === 0 ? "CURRICULUM VITAE" : "CURRICULUM VITAE · CONTINUED"} <i className="px-[.7cqw] not-italic text-neutral-300">/</i> 2026</span>
    </div>
  );
}

function PageFooter({ page }: { page: number }) {
  return (
    <footer className="mt-auto flex shrink-0 justify-between border-t border-neutral-200 pt-[1.7cqw] font-[var(--font-mono)] text-[1.3cqw] font-medium tracking-[.1em] text-neutral-400">
      <span>RABAT, MOROCCO <i className="px-[.5cqw] not-italic">·</i> AHMED BOURAMDANE</span>
      <span>0{page + 1} <i className="px-[.4cqw] not-italic">/</i> 02</span>
    </footer>
  );
}

function PaperPage({ page, pageRef, zoom, pan, onPointerDown, onPointerMove, onPointerUp }: {
  page: number;
  pageRef: RefObject<HTMLElement | null>;
  zoom: number;
  pan: { x: number; y: number };
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
}) {
  return (
    <article
      ref={pageRef}
      className={`resume-paper ${zoom > 1 ? "cursor-grab active:cursor-grabbing" : ""}`}
      style={{ transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      aria-label={`CV page ${page + 1} of ${pageCount}`}
    >
      <div className="flex h-full flex-col overflow-hidden px-[8.5%] pb-[5%] pt-[5.5%] text-neutral-800">
        <PageMasthead page={page} />

        {page === 0 ? (
          <>
            <header className="mt-[3.4cqw] grid grid-cols-[1fr_21cqw] items-center gap-[4cqw]">
              <div className="min-w-0">
                <p className="mb-[1.2cqw] font-[var(--font-mono)] text-[1.65cqw] font-medium tracking-[.12em] text-neutral-500">COMPUTER SCIENCE STUDENT <span className="px-[.5cqw] text-neutral-300">·</span> DEVELOPER</p>
                <h1 className="m-0 font-[var(--font-display)] text-[7.1cqw] font-semibold leading-[.9] tracking-[-.075em] text-neutral-900">
                  Ahmed<br /><span className="font-medium text-neutral-500">Bouramdane</span>
                </h1>
                <p className="mb-0 mt-[2.2cqw] font-[var(--font-mono)] text-[1.7cqw] font-medium tracking-[.08em] text-neutral-600">RABAT, MOROCCO</p>
              </div>
              <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-neutral-100 ring-1 ring-neutral-200">
                <Image
                  src="/official-img-cutout.webp"
                  alt="Portrait of Ahmed Bouramdane"
                  fill
                  priority
                  sizes="(max-width: 760px) 25vw, 125px"
                  className="object-cover object-top"
                />
              </div>
            </header>

            <div className="mt-[2.5cqw] flex flex-wrap gap-x-[2.2cqw] gap-y-[1cqw] border-y border-neutral-200 py-[1.5cqw] font-[var(--font-mono)] text-[1.55cqw] text-neutral-600">
              <a className="hover:text-neutral-950" href={`mailto:${contactEmail}`}>{contactEmail}</a>
              <span>+212 633 977 491</span>
              <a className="hover:text-neutral-950" href="https://linkedin.com/in/ahmedbouramdane" target="_blank" rel="noreferrer">LinkedIn</a>
              <a className="hover:text-neutral-950" href="https://github.com/ahmedbouramdane" target="_blank" rel="noreferrer">GitHub</a>
            </div>

            <section className="mt-[3cqw]">
              <SectionHeading number="01">About me</SectionHeading>
              <p className="m-0 text-[1.85cqw] leading-[1.55] text-neutral-600">
                I’m Ahmed, a 2 BAC Sciences Mathématiques student at LYDEX de Rabat. Curious about coding since childhood, I’m a self-directed learner who enjoys building software and exploring the connections between mathematics, AI, and practical problem-solving. I’m active in my school’s programming, robotics, and organization clubs, and hope to grow into a computer scientist and AI engineer.
              </p>
            </section>

            <section className="mt-[2.8cqw]">
              <SectionHeading number="02">Education</SectionHeading>
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="m-0 text-[2.1cqw] font-semibold text-neutral-800">LYDEX de Rabat</h3>
                <span className="font-[var(--font-mono)] text-[1.45cqw] tracking-[.07em] text-neutral-500">RABAT, MOROCCO</span>
              </div>
              <p className="mb-0 mt-[.7cqw] text-[1.8cqw] text-neutral-600">High school <i className="px-[.5cqw] not-italic text-neutral-400">·</i> 2 BAC Sciences Mathématiques</p>
            </section>

            <section className="mt-[2.8cqw]">
              <SectionHeading number="03">Technical skills</SectionHeading>
              <div className="grid grid-cols-2 gap-x-[5cqw] gap-y-[1.8cqw]">
                <div><h3 className="m-0 text-[1.8cqw] font-semibold text-neutral-800">Programming</h3><p className="mb-0 mt-[.5cqw] text-[1.65cqw] leading-[1.4] text-neutral-600">Python · JavaScript · TypeScript · PHP · Dart · Kotlin</p></div>
                <div><h3 className="m-0 text-[1.8cqw] font-semibold text-neutral-800">Web & mobile</h3><p className="mb-0 mt-[.5cqw] text-[1.65cqw] leading-[1.4] text-neutral-600">React · Next.js · Flutter · React Native · FastAPI</p></div>
                <div><h3 className="m-0 text-[1.8cqw] font-semibold text-neutral-800">AI & data</h3><p className="mb-0 mt-[.5cqw] text-[1.65cqw] leading-[1.4] text-neutral-600">PyTorch · scikit-learn · OpenCV · NumPy · Pandas</p></div>
                <div><h3 className="m-0 text-[1.8cqw] font-semibold text-neutral-800">Tools & databases</h3><p className="mb-0 mt-[.5cqw] text-[1.65cqw] leading-[1.4] text-neutral-600">Git · Docker · Linux · PostgreSQL · Firebase</p></div>
              </div>
            </section>

            <section className="mt-[2.8cqw]">
              <SectionHeading number="04">Selected projects</SectionHeading>
              <div className="grid grid-cols-2 gap-x-[4cqw]">
                {projects.slice(0, 4).map((project) => (
                  <article className="border-b border-neutral-100 py-[1.3cqw]" key={project.name}>
                    <h3 className="m-0 text-[1.75cqw] font-semibold leading-[1.3] text-neutral-800">{project.name}</h3>
                    <p className="mb-0 mt-[.4cqw] text-[1.55cqw] leading-[1.4] text-neutral-600">{project.detail}</p>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : (
          <>
            <header className="mb-[2.5cqw] mt-[4cqw]">
              <p className="m-0 font-[var(--font-mono)] text-[1.5cqw] font-medium tracking-[.12em] text-neutral-500">SELECTED WORK <span className="px-[.6cqw] text-neutral-300">·</span> LEARNING <span className="px-[.6cqw] text-neutral-300">·</span> ACTIVITIES</p>
              <h1 className="mb-0 mt-[1cqw] font-[var(--font-display)] text-[5cqw] font-semibold leading-none tracking-[-.06em] text-neutral-900">Projects &amp; interests</h1>
            </header>

            <section>
              <SectionHeading number="04">Selected projects <span className="font-normal text-neutral-500">(continued)</span></SectionHeading>
              {projects.slice(4).map((project) => (
                <article className="border-b border-neutral-100 py-[1.8cqw]" key={project.name}>
                  <h3 className="m-0 text-[2cqw] font-semibold text-neutral-800">{project.name}</h3>
                  <p className="mb-0 mt-[.7cqw] text-[1.8cqw] leading-[1.5] text-neutral-600">{project.detail}</p>
                </article>
              ))}
            </section>

            <section className="mt-[4cqw]">
              <SectionHeading number="05">Achievements &amp; competitions</SectionHeading>
              <p className="m-0 text-[1.8cqw] leading-[1.5] text-neutral-600">Interested in mathematics, programming, and robotics competitions as a way to challenge myself, learn, and collaborate. Active in programming and robotics clubs at LYDEX.</p>
            </section>

            <section className="mt-[4cqw]">
              <SectionHeading number="06">Certifications</SectionHeading>
              <div>
                {certifications.map((certificate) => (
                  <div className="grid grid-cols-[1fr_auto] items-baseline gap-2 border-b border-neutral-100 py-[1.8cqw]" key={certificate.title}>
                    <div className="flex flex-wrap items-baseline gap-x-[1.2cqw]">
                      <h3 className="m-0 text-[1.9cqw] font-semibold text-neutral-800">{certificate.title}</h3>
                      <span className="text-[1.65cqw] text-neutral-500">{certificate.issuer}</span>
                    </div>
                    <span className="font-[var(--font-mono)] text-[1.5cqw] text-neutral-500">{certificate.date}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-[4cqw]">
              <SectionHeading number="07">Languages</SectionHeading>
              <p className="m-0 text-[1.85cqw] text-neutral-600">Arabic <span className="px-[1.5cqw] text-neutral-300">/</span> French <span className="px-[1.5cqw] text-neutral-300">/</span> English</p>
            </section>

            <section className="mt-[4cqw]">
              <SectionHeading number="08">Additional activities</SectionHeading>
              <div className="grid grid-cols-2 gap-[4cqw]">
                <div><h3 className="m-0 text-[1.9cqw] font-semibold text-neutral-800">School clubs</h3><p className="mb-0 mt-[.6cqw] text-[1.7cqw] leading-[1.45] text-neutral-600">Programming, robotics, and organization at LYDEX.</p></div>
                <div><h3 className="m-0 text-[1.9cqw] font-semibold text-neutral-800">Independent learning</h3><p className="mb-0 mt-[.6cqw] text-[1.7cqw] leading-[1.45] text-neutral-600">Ongoing exploration of software, AI, mathematics, and open-source projects.</p></div>
              </div>
            </section>

            <section className="mt-auto border-t border-neutral-200 pt-[3cqw]">
              <SectionHeading number="09">Contact</SectionHeading>
              <div className="grid grid-cols-2 gap-x-[4cqw] gap-y-[1.5cqw] text-[1.65cqw] text-neutral-600">
                <a className="truncate hover:text-neutral-950" href={`mailto:${contactEmail}`}>{contactEmail}</a>
                <span>+212 633 977 491</span>
                <a className="truncate hover:text-neutral-950" href="https://linkedin.com/in/ahmedbouramdane" target="_blank" rel="noreferrer">linkedin.com/in/ahmedbouramdane</a>
                <a className="truncate hover:text-neutral-950" href="https://github.com/ahmedbouramdane" target="_blank" rel="noreferrer">github.com/ahmedbouramdane</a>
              </div>
            </section>
          </>
        )}

        <PageFooter page={page} />
      </div>
    </article>
  );
}

export default function CvViewer() {
  const stageRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLElement>(null);
  const dragRef = useRef<{ pointerId: number; x: number; y: number; panX: number; panY: number } | null>(null);
  const [page, setPage] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const clampPan = useCallback((x: number, y: number, scale = zoom) => {
    const stage = stageRef.current;
    const paper = pageRef.current;
    if (!stage || !paper) return { x, y };
    const maxX = Math.max(0, (paper.offsetWidth * scale - stage.clientWidth) / 2);
    const maxY = Math.max(0, (paper.offsetHeight * scale - stage.clientHeight) / 2);
    return { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) };
  }, [zoom]);

  const changePage = useCallback((nextPage: number) => {
    setPage(Math.max(0, Math.min(pageCount - 1, nextPage)));
    setPan({ x: 0, y: 0 });
  }, []);

  const changeZoom = useCallback((amount: number) => {
    const nextZoom = Math.round(Math.max(1, Math.min(2, zoom + amount)) * 10) / 10;
    setZoom(nextZoom);
    setPan((current) => clampPan(current.x, current.y, nextZoom));
  }, [clampPan, zoom]);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (zoom <= 1 || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setPan(clampPan(drag.panX + event.clientX - drag.x, drag.panY + event.clientY - drag.y));
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && ["INPUT", "TEXTAREA", "BUTTON", "A"].includes(event.target.tagName)) return;
      if (event.key === "ArrowLeft" || event.key === "PageUp") changePage(page - 1);
      if (event.key === "ArrowRight" || event.key === "PageDown") changePage(page + 1);
      if (event.key === "+" || event.key === "=") changeZoom(0.1);
      if (event.key === "-") changeZoom(-0.1);
      if (event.key === "0") resetView();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [changePage, changeZoom, page, resetView]);

  useEffect(() => {
    const handleResize = () => setPan((current) => clampPan(current.x, current.y));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [clampPan]);

  return (
    <main className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-neutral-200 text-neutral-800">
      <header className="z-10 grid min-h-[58px] grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-neutral-300 bg-neutral-50 px-3 sm:min-h-16 sm:px-8">
        <Link className="inline-flex w-fit items-center gap-2 text-[9px] font-medium tracking-[.08em] text-neutral-600 transition hover:text-black" href="/#about" aria-label="Back to About me">
          <ArrowLeft size={17} aria-hidden="true" /><span className="hidden sm:inline">BACK TO PORTFOLIO</span>
        </Link>
        <div className="inline-flex items-center gap-2 justify-self-center font-[var(--font-mono)] text-[8px] font-medium tracking-[.08em] text-neutral-700">
          <FileText size={15} aria-hidden="true" className="text-neutral-500" /><span>AHMED BOURAMDANE <i className="px-1 text-neutral-300 not-italic">/</i> CV</span>
        </div>
        <div className="flex items-center justify-self-end gap-1 sm:gap-2" aria-label="Document controls">
          <div className="flex h-8 items-center rounded-md border border-neutral-300 bg-white px-1">
            <button type="button" onClick={() => changePage(page - 1)} disabled={page === 0} aria-label="Previous page" className="grid size-6 place-items-center rounded text-neutral-600 transition hover:bg-neutral-200 disabled:opacity-30"><ArrowLeft size={14} /></button>
            <span className="min-w-[34px] text-center font-[var(--font-mono)] text-[8px] text-neutral-500" aria-live="polite">{String(page + 1).padStart(2, "0")} / 02</span>
            <button type="button" onClick={() => changePage(page + 1)} disabled={page === pageCount - 1} aria-label="Next page" className="grid size-6 place-items-center rounded text-neutral-600 transition hover:bg-neutral-200 disabled:opacity-30"><ArrowRight size={14} /></button>
          </div>
          <div className="flex h-8 items-center rounded-md border border-neutral-300 bg-white px-1">
            <button type="button" onClick={() => changeZoom(-0.1)} disabled={zoom <= 1} aria-label="Zoom out" className="grid size-6 place-items-center rounded text-neutral-600 transition hover:bg-neutral-200 disabled:opacity-30"><Minus size={14} /></button>
            <span className="min-w-[33px] text-center font-[var(--font-mono)] text-[8px] text-neutral-500">{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={() => changeZoom(0.1)} aria-label="Zoom in" className="grid size-6 place-items-center rounded text-neutral-600 transition hover:bg-neutral-200"><Plus size={14} /></button>
            <button type="button" onClick={resetView} aria-label="Fit page to screen" className="grid size-6 place-items-center rounded text-neutral-600 transition hover:bg-neutral-200"><RotateCcw size={13} /></button>
          </div>
        </div>
      </header>

      <div className="relative grid min-h-0 flex-1 place-items-center overflow-hidden px-3 py-3 sm:px-8" ref={stageRef} aria-label="CV page viewer">
        <PaperPage
          page={page}
          pageRef={pageRef}
          zoom={zoom}
          pan={pan}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      </div>

      <footer className="flex min-h-[34px] items-center justify-between gap-3 px-3 font-[var(--font-mono)] text-[7px] tracking-[.08em] text-neutral-500 sm:px-8">
        <span className="inline-flex items-center gap-2"><Move size={12} aria-hidden="true" /> {zoom > 1 ? "DRAG PAGE TO PAN" : "FIT TO SCREEN"}</span>
        <span>USE ← → TO TURN PAGES</span>
      </footer>
    </main>
  );
}
