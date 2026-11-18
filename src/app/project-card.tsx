import { MoveUpRight } from "lucide-react";
import ProjectImage from "./project-image";

export type PortfolioProject = {
  id: number;
  sort_order: number;
  number: string;
  title: string;
  category: string;
  description: string;
  stack: string[];
  repo: string;
  image: string;
};

export function isPortfolioProject(value: unknown): value is Omit<PortfolioProject, "number"> {
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
    && typeof project.image === "string";
}

export function ProjectCard({ project, reveal = true }: { project: PortfolioProject; reveal?: boolean }) {
  return (
    <article className={`project-card${reveal ? " reveal" : ""}`}>
      <div className="project-visual" aria-hidden="true">
        <ProjectImage className="project-image" src={project.image} alt="" sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 600px" />
        <span className="project-image-overlay" />
        <span className="visual-index">PROJECT / {project.number}</span>
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