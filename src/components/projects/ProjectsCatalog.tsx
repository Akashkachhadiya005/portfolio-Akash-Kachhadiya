"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Layers } from "lucide-react";
import { projects } from "@/data/projects";
import { ProjectCard } from "@/components/ui/ProjectCard";

export function ProjectsCatalog() {
  const [activeDomain, setActiveDomain] = useState<string>("ALL");

  // Dynamically extract distinct domains from the dataset
  const domains = Array.from(new Set(projects.map((p) => p.domain)));
  const categories = ["ALL", ...domains];

  const filteredProjects =
    activeDomain === "ALL"
      ? projects
      : projects.filter((p) => p.domain === activeDomain);

  return (
    <div>
      {/* Dynamic Category Filter Pills with Live Counts */}
      <div className="mt-8 flex flex-wrap items-center gap-2">
        {categories.map((cat) => {
          const count =
            cat === "ALL"
              ? projects.length
              : projects.filter((p) => p.domain === cat).length;

          const isActive = activeDomain === cat;

          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveDomain(cat)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-all duration-150 cursor-pointer select-none inline-flex items-center gap-1.5 ${
                isActive
                  ? "bg-accent text-accent-foreground shadow-md shadow-accent/25"
                  : "border border-border/80 bg-card/70 text-muted-foreground hover:border-accent/40 hover:text-foreground"
              }`}
            >
              <span>{cat === "ALL" ? "All Case Studies" : cat}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  isActive
                    ? "bg-black/20 text-accent-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid of Case Studies */}
      <motion.div
        layout
        className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7"
      >
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((project, i) => (
            <motion.div
              key={project.slug}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
            >
              <ProjectCard project={project} index={i} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
