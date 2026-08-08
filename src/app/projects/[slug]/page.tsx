import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { projects } from "@/data/projects";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) return { title: "Not Found" };
  return {
    title: project.title,
    description: project.problem,
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);

  if (!project) notFound();

  const currentIndex = projects.findIndex((p) => p.slug === slug);
  const prev = currentIndex > 0 ? projects[currentIndex - 1] : null;
  const next = currentIndex < projects.length - 1 ? projects[currentIndex + 1] : null;

  return (
    <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Back link */}
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All Projects
        </Link>

        {/* Title */}
        <h1 className="mt-6 text-3xl font-bold sm:text-4xl">{project.title}</h1>

        {/* Tech chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          {project.stack.map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-medium text-accent"
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Impact */}
        <div className="mt-6 rounded-lg border border-accent/30 bg-accent/5 p-4">
          <p className="text-sm font-medium text-accent">Impact</p>
          <p className="mt-1 text-lg font-semibold text-foreground">{project.impact}</p>
        </div>

        {/* Sections */}
        <div className="mt-10 space-y-8">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Problem</h2>
            <p className="mt-2 text-muted-foreground leading-relaxed">
              {project.problem}
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">Approach</h2>
            <p className="mt-2 text-muted-foreground leading-relaxed">
              {project.approach}
            </p>
          </div>

          {project.challenges && (
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Challenges & Learnings
              </h2>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                {project.challenges}
              </p>
            </div>
          )}
        </div>

        {/* Links */}
        <div className="mt-10 flex flex-wrap gap-4">
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Live Demo
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              GitHub
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>

        {/* Prev / Next navigation */}
        <div className="mt-14 flex items-center justify-between border-t border-border pt-6">
          {prev ? (
            <Link
              href={`/projects/${prev.slug}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/projects/${next.slug}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {next.title} →
            </Link>
          ) : (
            <span />
          )}
        </div>
      </div>
    </section>
  );
}
