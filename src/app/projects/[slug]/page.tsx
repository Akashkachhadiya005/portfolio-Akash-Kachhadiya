import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Sparkles,
  Database,
  BarChart3,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  Award,
  TrendingUp,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { GithubIcon } from "@/components/ui/BrandIcons";
import { projects } from "@/data/projects";
import { siteConfig } from "@/data/site-config";
import { Button3D } from "@/components/ui/Button3D";
import { BackButton3D } from "@/components/ui/BackButton3D";

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
    title: `${project.title} — Machine Learning Case Study`,
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
    <article className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Dynamic Back Navigation matching 3D soap style */}
        <div className="mb-6">
          <BackButton3D fallbackHref="/projects" />
        </div>

        {/* Header Section */}
        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs font-bold text-accent uppercase tracking-wider">
              <Sparkles className="h-3 w-3" />
              {project.domain}
            </span>
            <span className="text-xs text-muted-foreground">
              {project.datasetInfo.name}
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {project.title}
          </h1>

          <p className="mt-3 text-base sm:text-lg text-muted-foreground leading-relaxed">
            {project.tagline}
          </p>
        </div>

        {/* High-Resolution Project Visual Banner */}
        <div className="relative mt-8 h-64 sm:h-96 w-full overflow-hidden rounded-2xl border border-border/80 bg-black/60 shadow-2xl">
          <Image
            src={project.image}
            alt={`${project.title} dashboard visualization`}
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-transparent to-transparent opacity-70" />
        </div>

        {/* Quick Highlights Strip */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border/80 bg-card/70 p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
              <Award className="h-4 w-4" />
              Top Model & Metric
            </div>
            <p className="mt-1 text-base font-bold text-foreground truncate">
              {project.bestModel.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {project.bestModel.metric}: <strong className="text-accent">{project.bestModel.value}</strong>
            </p>
            {project.bestModel.subMetric && (
              <p className="text-[11px] text-muted-foreground mt-1 border-t border-border/50 pt-1 truncate">
                {project.bestModel.subMetric}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-border/80 bg-card/70 p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
              <Database className="h-4 w-4" />
              Dataset Specs
            </div>
            <p className="mt-1 text-base font-bold text-foreground">
              {project.datasetInfo.records}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {project.datasetInfo.features}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 border-t border-border/50 pt-1 truncate">
              Target: {project.datasetInfo.target}
            </p>
          </div>

          <div className="rounded-xl border border-border/80 bg-card/70 p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
              <BarChart3 className="h-4 w-4" />
              Validated Outcome
            </div>
            <p className="mt-1 text-base font-bold text-foreground leading-snug">
              {project.impact}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Verified Notebook Results
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            href={project.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-xs sm:text-sm font-bold text-accent-foreground shadow-md shadow-accent/25 hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/40 transition-all cursor-pointer"
          >
            <GithubIcon className="h-4 w-4" />
            <span>Explore Code on GitHub</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <a
            href={`mailto:${siteConfig.email}?subject=Inquiry%20regarding%20${encodeURIComponent(project.title)}`}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-xs sm:text-sm font-semibold text-foreground hover:bg-muted/50 transition-all cursor-pointer"
          >
            <Mail className="h-4 w-4 text-accent" />
            <span>Discuss This Project</span>
          </a>
        </div>

        {/* Tech Stack Chips */}
        <div className="mt-8 pt-6 border-t border-border/60">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Technologies & Machine Learning Frameworks
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {project.stack.map((tech) => (
              <span
                key={tech}
                className="rounded-lg border border-border/80 bg-card px-3 py-1 text-xs font-semibold text-foreground"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Detailed Case Study Sections */}
        <div className="mt-12 space-y-12">
          {/* 1. Problem Definition */}
          <section>
            <h2 className="flex items-center gap-2.5 text-xl font-bold text-foreground">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent text-xs font-bold">
                01
              </span>
              Business & Clinical Problem Context
            </h2>
            <div className="mt-3 rounded-2xl border border-border/70 bg-card/50 p-6 leading-relaxed text-sm sm:text-base text-muted-foreground">
              {project.problem}
            </div>
          </section>

          {/* 2. Approach & ML Methodology */}
          <section>
            <h2 className="flex items-center gap-2.5 text-xl font-bold text-foreground">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent text-xs font-bold">
                02
              </span>
              Data Pipeline & Model Engineering
            </h2>
            <div className="mt-3 rounded-2xl border border-border/70 bg-card/50 p-6 leading-relaxed text-sm sm:text-base text-muted-foreground">
              {project.approach}
            </div>
          </section>

          {/* 3. Benchmark Comparisons */}
          {project.benchmarks && project.benchmarks.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2.5 text-xl font-bold text-foreground">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent text-xs font-bold">
                  03
                </span>
                Algorithm Evaluation & Empirical Benchmarks
              </h2>

              <div className="mt-3 overflow-x-auto rounded-2xl border border-border/80 bg-card/60 shadow-inner">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="border-b border-border/80 bg-muted/40 text-muted-foreground font-semibold">
                    <tr>
                      <th className="py-3 px-4">Algorithm / Model</th>
                      {project.benchmarks.some((b) => b.trainScore) && (
                        <th className="py-3 px-4">Train Score</th>
                      )}
                      <th className="py-3 px-4">Test Accuracy / Score</th>
                      {project.benchmarks.some((b) => b.cvScore) && (
                        <th className="py-3 px-4">5-Fold CV</th>
                      )}
                      {project.benchmarks.some((b) => b.precision) && (
                        <th className="py-3 px-4">Precision</th>
                      )}
                      {project.benchmarks.some((b) => b.recall) && (
                        <th className="py-3 px-4">Recall</th>
                      )}
                      {project.benchmarks.some((b) => b.f1Score) && (
                        <th className="py-3 px-4">F1-Score / Metric</th>
                      )}
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {project.benchmarks.map((b) => (
                      <tr
                        key={b.model}
                        className={
                          b.status === "best"
                            ? "bg-accent/10 font-semibold"
                            : "hover:bg-muted/20"
                        }
                      >
                        <td className="py-3 px-4 text-foreground flex items-center gap-2">
                          {b.status === "best" && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />
                          )}
                          {b.model}
                        </td>
                        {project.benchmarks?.some((item) => item.trainScore) && (
                          <td className="py-3 px-4 font-mono text-muted-foreground">{b.trainScore || "—"}</td>
                        )}
                        <td className="py-3 px-4 font-mono font-semibold text-foreground">{b.accuracy || b.testScore || "—"}</td>
                        {project.benchmarks?.some((item) => item.cvScore) && (
                          <td className="py-3 px-4 font-mono text-muted-foreground">{b.cvScore || "—"}</td>
                        )}
                        {project.benchmarks?.some((item) => item.precision) && (
                          <td className="py-3 px-4 font-mono">{b.precision || "—"}</td>
                        )}
                        {project.benchmarks?.some((item) => item.recall) && (
                          <td className="py-3 px-4 font-mono">{b.recall || "—"}</td>
                        )}
                        {project.benchmarks?.some((item) => item.f1Score) && (
                          <td className="py-3 px-4 font-mono text-accent">
                            {b.f1Score || "—"}
                          </td>
                        )}
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              b.status === "best"
                                ? "bg-accent text-accent-foreground shadow-sm"
                                : b.status === "contender"
                                ? "bg-primary/20 text-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {b.status || "baseline"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Generalization & Model Selection Strategy Callout */}
              {project.generalizationAnalysis && (
                <div className="mt-4 rounded-xl border border-accent/30 bg-accent/5 p-5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
                    <ShieldCheck className="h-4 w-4" />
                    Model Selection & Generalization Strategy
                  </div>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-foreground/90">
                    {project.generalizationAnalysis}
                  </p>
                </div>
              )}
            </section>
          )}

          {/* 4. Estimated Business & Clinical ROI */}
          {project.businessRoi && (
            <section>
              <h2 className="flex items-center gap-2.5 text-xl font-bold text-foreground">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent text-xs font-bold">
                  04
                </span>
                Quantifiable Business & Operational Impact
              </h2>
              <div className="mt-3 flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 leading-relaxed text-sm sm:text-base text-foreground/90">
                <TrendingUp className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>{project.businessRoi}</div>
              </div>
            </section>
          )}

          {/* 5. Challenges & Engineering Solutions */}
          {project.challenges && (
            <section>
              <h2 className="flex items-center gap-2.5 text-xl font-bold text-foreground">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent text-xs font-bold">
                  05
                </span>
                Challenges Encountered & Engineering Solutions
              </h2>
              <div className="mt-3 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 leading-relaxed text-sm sm:text-base text-foreground/90">
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>{project.challenges}</div>
              </div>
            </section>
          )}

          {/* 6. Key Domain Insights */}
          {project.keyInsights && project.keyInsights.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2.5 text-xl font-bold text-foreground">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent text-xs font-bold">
                  06
                </span>
                Key Data & Diagnostic Insights
              </h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-1">
                {project.keyInsights.map((insight, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-xl border border-border/80 bg-card/60 p-4 text-sm text-foreground/90"
                  >
                    <Lightbulb className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 7. Recruiter & Client CTA Banner */}
          <section className="rounded-2xl border border-accent/40 bg-gradient-to-br from-card via-card to-accent/10 p-6 sm:p-8 text-center sm:text-left shadow-lg">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">
                  <Sparkles className="h-3.5 w-3.5" />
                  Available for Machine Learning & Data Science Opportunities
                </span>
                <h3 className="mt-2 text-xl sm:text-2xl font-bold text-foreground">
                  Interested in deploying ML solutions like this?
                </h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-xl">
                  Whether you are hiring for an ML/AI role or need high-performance predictive pipelines built for your business, let&apos;s connect and discuss your requirements.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
                <a
                  href={`mailto:${siteConfig.email}?subject=Opportunity%20Inquiry%20via%20Portfolio%20(${encodeURIComponent(project.title)})`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-xs sm:text-sm font-bold text-accent-foreground shadow-md shadow-accent/25 hover:bg-accent/90 transition-all cursor-pointer"
                >
                  <Mail className="h-4 w-4" />
                  <span>Contact Akash</span>
                </a>
                <Link
                  href="/projects"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs sm:text-sm font-semibold text-foreground hover:bg-muted/50 transition-all"
                >
                  <span>All Projects</span>
                </Link>
              </div>
            </div>
          </section>
        </div>

        {/* Prev / Next navigation */}
        <div className="mt-16 flex items-center justify-between border-t border-border/80 pt-6">
          {prev ? (
            <Link
              href={`/projects/${prev.slug}`}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-accent transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/projects/${next.slug}`}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-accent transition-colors"
            >
              <span>{next.title}</span>
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </Link>
          ) : (
            <span />
          )}
        </div>
      </div>
    </article>
  );
}
