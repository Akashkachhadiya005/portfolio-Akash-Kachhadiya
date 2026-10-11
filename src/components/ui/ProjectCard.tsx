"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, Eye, ArrowRight, Database, ExternalLink } from "lucide-react";
import { GithubIcon } from "@/components/ui/BrandIcons";
import type { Project } from "@/types";

interface ProjectCardProps {
  project: Project;
  index?: number;
}

export function ProjectCard({ project, index = 0 }: ProjectCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.35,
        delay: index * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="h-full"
    >
      {/* 
        Native GPU-accelerated card container matching CertificateCard3D:
        Silky-smooth, progressive lift on hover (zero jerk / no jhatka)
      */}
      <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-sm transform-gpu will-change-transform transition-[transform,box-shadow,border-color] duration-350 ease-out hover:-translate-y-1.5 hover:border-accent/60 hover:shadow-xl hover:shadow-accent/10">
        
        {/* 1. TOP: High-Definition Visual Preview Banner */}
        <Link
          href={`/projects/${project.slug}`}
          className="group/banner relative mb-4 h-48 w-full cursor-pointer overflow-hidden rounded-xl border border-border/60 bg-black/40 shadow-inner transform-gpu block"
          title={`View ${project.title} case study`}
        >
          <Image
            src={project.image}
            alt={`${project.title} dashboard preview`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 420px"
            className="object-cover object-center filter brightness-[0.94] transform-gpu transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/banner:scale-[1.04] group-hover/banner:brightness-105"
            priority={index < 2}
          />
          {/* Subtle gradient vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-75 transition-opacity duration-200 group-hover/banner:opacity-40" />

          {/* Domain Pill (Floating Top Left) */}
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/65 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md shadow-sm">
              <Sparkles className="h-3 w-3 text-accent" />
              {project.domain}
            </span>
          </div>

          {/* Quick View Pill (Hover Centered) */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-200 ease-out group-hover/banner:opacity-100 group-hover/banner:scale-100 scale-95 z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground shadow-lg backdrop-blur-md">
              <Eye className="h-3.5 w-3.5" />
              View Case Study
            </span>
          </div>
        </Link>

        {/* 2. Title & Subtitle */}
        <div>
          <Link
            href={`/projects/${project.slug}`}
            className="block text-base sm:text-lg font-bold text-foreground leading-snug transition-colors duration-150 hover:text-accent group-hover:text-accent"
          >
            {project.title}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-1 font-medium">
            {project.tagline}
          </p>
        </div>

        {/* 3. Key Benchmark Metric Badge */}
        <div className="mt-3.5 rounded-xl border border-accent/25 bg-accent/5 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-accent">
                {project.bestModel.metric}
              </p>
              <p className="truncate text-xs font-semibold text-foreground/90 mt-0.5">
                {project.bestModel.name}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center rounded-lg bg-accent/20 px-2.5 py-1 text-xs font-bold text-accent font-mono shadow-sm">
              {project.bestModel.value}
            </span>
          </div>
          {project.bestModel.subMetric && (
            <p className="mt-1.5 text-[11px] text-muted-foreground font-medium border-t border-accent/15 pt-1.5 truncate">
              {project.bestModel.subMetric}
            </p>
          )}
        </div>

        {/* 4. Business Problem Summary */}
        <p className="mt-3 text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {project.problem}
        </p>

        {/* 5. Dataset Info */}
        <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
          <Database className="h-3.5 w-3.5 text-accent shrink-0" />
          <span className="truncate">{project.datasetInfo.name} · {project.datasetInfo.records}</span>
        </div>

        {/* 6. Tech Stack Chips */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.stack.slice(0, 4).map((tech) => (
            <span
              key={tech}
              className="rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground/80"
            >
              {tech}
            </span>
          ))}
          {project.stack.length > 4 && (
            <span className="rounded-md bg-muted/30 px-2 py-0.5 text-[11px] text-muted-foreground">
              +{project.stack.length - 4}
            </span>
          )}
        </div>

        {/* 7. BOTTOM ACTION TOOLBAR */}
        <div className="mt-auto pt-5 border-t border-border/60 flex items-center justify-between gap-2.5">
          <Link
            href={`/projects/${project.slug}`}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground shadow-sm transform-gpu transition-all duration-150 ease-out hover:bg-accent/90 hover:-translate-y-0.5 hover:shadow-md hover:shadow-accent/25 active:translate-y-0 active:shadow-sm"
          >
            <span>Case Study</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          <a
            href={project.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-background/80 px-3.5 py-2 text-xs font-semibold text-foreground transform-gpu transition-all duration-150 ease-out hover:border-accent/50 hover:bg-accent/10 hover:text-accent hover:-translate-y-0.5 active:translate-y-0 shrink-0"
            title={`Open ${project.title} on GitHub`}
          >
            <GithubIcon className="h-4 w-4" />
            <span>Code</span>
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
