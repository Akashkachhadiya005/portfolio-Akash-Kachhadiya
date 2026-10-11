"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { ArrowRight, FolderGit2 } from "lucide-react";
import { projects } from "@/data/projects";
import { ProjectCard } from "@/components/ui/ProjectCard";

export function ProjectsSection() {
  // Always display exactly the top 3 premier featured projects on the homepage
  const displayedProjects = projects.slice(0, 3);

  return (
    <section id="projects" className="py-20 sm:py-28 relative">
      <div className="page-shell">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-2xl mx-auto"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1 text-xs font-bold text-accent uppercase tracking-widest backdrop-blur-md">
            <FolderGit2 className="h-3.5 w-3.5" />
            Machine Learning Engineering
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Featured Projects & Case Studies
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
            Real-world predictive models and machine learning pipelines built from clinical, customer, and enterprise datasets with rigorous evaluation benchmarks.
          </p>
        </motion.div>

        {/* Projects Grid: Exactly 3 cards in a single responsive row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 mt-10">
          {displayedProjects.map((project, i) => (
            <ProjectCard key={project.slug} project={project} index={i} />
          ))}
        </div>

        {/* Bottom CTA to explore all projects with dynamic count */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mt-12 text-center"
        >
          <Link
            href="/projects"
            className="group inline-flex items-center gap-2.5 rounded-full border border-border/80 bg-card/80 px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition-all duration-200 hover:border-accent/60 hover:bg-accent/10 hover:text-accent hover:shadow-lg hover:shadow-accent/10 active:scale-[0.98]"
          >
            <span>Explore all case studies & architectures ({projects.length})</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
