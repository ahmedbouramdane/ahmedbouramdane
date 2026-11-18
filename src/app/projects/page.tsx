"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowUpRight, Search, X } from "lucide-react";
import { FaGithub as Github } from "react-icons/fa6";
import { ProjectCard, isPortfolioProject, type PortfolioProject } from "../project-card";

type SortMode = "featured" | "newest" | "title";

const sortLabels: Record<SortMode, string> = {
  featured: "Featured",
  newest: "Newest",
  title: "A → Z",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState<SortMode>("featured");

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
          setProjects(payload.map((project, index) => ({
            ...project,
            number: String(index + 1).padStart(2, "0"),
          })));
        }
      })
      .catch((error: unknown) => {
        console.error("Could not load the latest portfolio projects.", error);
        if (active) setHasError(true);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(projects.map((project) => project.category)))],
    [projects],
  );

  const visibleProjects = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = projects.filter((project) => {
      const matchesCategory = category === "All" || project.category === category;
      if (!matchesCategory) return false;
      if (!needle) return true;
      return (
        project.title.toLowerCase().includes(needle)
        || project.description.toLowerCase().includes(needle)
        || project.category.toLowerCase().includes(needle)
        || project.stack.some((item) => item.toLowerCase().includes(needle))
      );
    });

    if (sort === "title") return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "newest") return [...filtered].sort((a, b) => b.id - a.id);
    return filtered;
  }, [projects, category, query, sort]);

  const hasFilters = category !== "All" || query.trim().length > 0;

  const clearFilters = () => {
    setQuery("");
    setCategory("All");
  };

  return (
    <div className="subpage">
      <header className="subpage-header">
        <div className="section-shell subpage-header-inner">
          <Link className="brand" href="/" aria-label="Ahmed Bouramdane — home">
            <span className="brand-logo-frame">
              <Image className="brand-logo" src="/logo.png" alt="" width={512} height={512} />
            </span>
            <span className="brand-copy">
              <span className="brand-name">Ahmed BOURAMDANE</span>
              <span className="brand-caption">Software · AI · Creative Technology</span>
            </span>
          </Link>
          <div className="subpage-header-actions">
            <Link className="subpage-back" href="/">
              <ArrowLeft size={15} aria-hidden="true" /> Back to portfolio
            </Link>
            <a className="header-social" href="https://github.com/ahmedbouramdane" target="_blank" rel="noreferrer" aria-label="GitHub profile">
              <Github size={17} strokeWidth={1.7} />
            </a>
          </div>
        </div>
      </header>

      <main className="subpage-main">
        <section className="subpage-hero">
          <div className="section-shell">
            <p className="eyebrow"><span className="eyebrow-dot" />All projects</p>
            <h1 className="subpage-title">Project <span>archive.</span></h1>
            <p className="subpage-lead">A complete collection of experiments, tools, and applications. Search and filter to find exactly what you’re looking for.</p>
          </div>
        </section>

        <section className="subpage-body section-shell" aria-label="Project collection">
          <div className="projects-toolbar">
            <label className="projects-search">
              <Search size={17} aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, stack, or category…"
                aria-label="Search projects"
              />
              {query && (
                <button type="button" className="projects-search-clear" onClick={() => setQuery("")} aria-label="Clear search">
                  <X size={15} aria-hidden="true" />
                </button>
              )}
            </label>
            <label className="projects-sort">
              <span>Sort</span>
              <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)} aria-label="Sort projects">
                {(Object.keys(sortLabels) as SortMode[]).map((mode) => (
                  <option key={mode} value={mode}>{sortLabels[mode]}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="projects-cats" role="group" aria-label="Filter by category">
            {categories.map((item) => (
              <button
                type="button"
                key={item}
                className={category === item ? "selected" : ""}
                onClick={() => setCategory(item)}
                aria-pressed={category === item}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="projects-status">
            <span>{String(visibleProjects.length).padStart(2, "0")} {visibleProjects.length === 1 ? "project" : "projects"}</span>
            {hasFilters && (
              <button type="button" className="projects-clear" onClick={clearFilters}>Clear filters</button>
            )}
          </div>

          {isLoading ? (
            <div className="projects-state" role="status">
              <span className="projects-spinner" aria-hidden="true" />
              <p>Loading projects…</p>
            </div>
          ) : hasError ? (
            <div className="projects-state" role="alert">
              <p>Projects are temporarily unavailable. Please try again shortly.</p>
              <button type="button" className="projects-see-all" onClick={() => window.location.reload()}>Try again</button>
            </div>
          ) : visibleProjects.length === 0 ? (
            <div className="projects-state">
              <p>No projects match your search.</p>
              <button type="button" className="projects-see-all" onClick={clearFilters}>Clear filters</button>
            </div>
          ) : (
            <div className="project-grid" aria-live="polite">
              {visibleProjects.map((project) => (
                <ProjectCard project={project} key={project.id} reveal={false} />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="subpage-footer section-shell">
        <Link className="footer-brand" href="/">Ahmed Bouramdane<span>.</span></Link>
        <Link className="subpage-back" href="/">Back to portfolio <ArrowUpRight size={14} aria-hidden="true" /></Link>
      </footer>
    </div>
  );
}