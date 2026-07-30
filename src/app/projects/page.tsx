import type { Metadata } from "next";
import { projects } from "@/data/projects";
import { ProjectCard } from "@/components/ui/ProjectCard";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "ML and AI projects by Akash Kachhadiya — from churn prediction to skin disorder classification, with real accuracy metrics.",
};

export default function ProjectsPage() {
  return (
    <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold sm:text-4xl">All Projects</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Each project focuses on solving a real problem with measurable impact.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}
