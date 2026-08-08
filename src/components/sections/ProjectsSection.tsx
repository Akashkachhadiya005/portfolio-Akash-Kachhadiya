"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { projects } from "@/data/projects";
import { ProjectCard } from "@/components/ui/ProjectCard";

export function ProjectsSection() {
  // Show every project, not just `featured`. Only 3 of the 4 were flagged, so a
  // wide screen with room for 4+ columns still rendered 3 cards and left a gap
  // on the right. The card grid decides how many fit; the data should not.
  const featured = projects;

  return (
    <section id="projects" className="py-20 sm:py-28">
      <div className="page-shell-narrow">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-sm font-medium uppercase tracking-widest text-accent">
            Projects
          </h2>
          <p className="mt-2 text-3xl font-bold sm:text-4xl">What I&apos;ve Built</p>
        </motion.div>

        <div className="card-grid mt-10">
          {featured.map((project, i) => (
            <motion.div
              key={project.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-10 text-center"
        >
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-accent transition-colors"
          >
            View all projects
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
