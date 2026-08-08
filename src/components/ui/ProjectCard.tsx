"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/types";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group flex h-full flex-col rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-lg hover:shadow-accent/5"
    >
      <h3 className="text-lg font-semibold text-foreground group-hover:text-accent transition-colors">
        {project.title}
      </h3>

      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{project.problem}</p>

      {/* Tech chips */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {project.stack.slice(0, 4).map((tech) => (
          <span
            key={tech}
            className="rounded-md bg-muted/50 px-2 py-0.5 text-xs font-medium text-muted-foreground"
          >
            {tech}
          </span>
        ))}
      </div>

      {/* Impact */}
      <p className="mt-4 text-sm font-semibold text-accent">↗ {project.impact}</p>

      {/* Link */}
      <div className="mt-auto pt-4">
        <Link
          href={`/projects/${project.slug}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-accent transition-colors"
        >
          View case study
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </motion.div>
  );
}
