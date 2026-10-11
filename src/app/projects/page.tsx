import type { Metadata } from "next";
import { FolderGit2, Sparkles } from "lucide-react";
import { projects } from "@/data/projects";
import { ProjectsCatalog } from "@/components/projects/ProjectsCatalog";
import { BackButton3D } from "@/components/ui/BackButton3D";

export const metadata: Metadata = {
  title: "Machine Learning Projects",
  description:
    "Real-world Machine Learning and AI engineering projects by Akash Kachhadiya — from clinical disease prediction to telecom churn and workforce analytics, backed by authentic Jupyter notebook benchmarks.",
};

export default function ProjectsPage() {
  return (
    <section className="py-20 sm:py-28 relative">
      <div className="page-shell">
        <div className="mb-8">
          <BackButton3D fallbackHref="/" />
        </div>

        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1 text-xs font-bold text-accent uppercase tracking-widest backdrop-blur-md">
            <FolderGit2 className="h-3.5 w-3.5" />
            Machine Learning Engineering Portfolio
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Machine Learning Projects
          </h1>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            Authentic end-to-end predictive systems engineered from clinical, behavioral, and public datasets. Each project features data preprocessing, model selection across multiple algorithms, and hyperparameter tuning.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-2.5 py-1 font-semibold text-accent">
              <Sparkles className="h-3 w-3" />
              {projects.length} Production-Grade Projects
            </span>
            <span>•</span>
            <span>Healthcare AI</span>
            <span>•</span>
            <span>Customer Analytics</span>
            <span>•</span>
            <span>Enterprise HR</span>
          </div>
        </div>

        <ProjectsCatalog />
      </div>
    </section>
  );
}
