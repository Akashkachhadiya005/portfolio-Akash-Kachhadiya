/** Core types for the portfolio — single source of truth */

export type SiteConfig = {
  name: string;
  title: string;
  tagline: string;
  description: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  location: string;
  currentLocation: string;
  github: string;
  linkedin: string;
  /** Path to resume PDF in /public. Undefined = hide Resume button. */
  resumePath?: string;
};

export type NavLink = {
  label: string;
  href: string;
};

export type ProjectBenchmark = {
  model: string;
  trainScore?: string;
  testScore?: string;
  accuracy?: string;
  precision?: string;
  recall?: string;
  f1Score?: string;
  cvScore?: string;
  status?: "best" | "contender" | "baseline";
};

export type Project = {
  slug: string;
  title: string;
  tagline: string;
  domain: "Healthcare AI" | "Customer Analytics" | "Enterprise HR" | "Workforce & Compensation";
  problem: string;
  datasetInfo: {
    name: string;
    records: string;
    features: string;
    target: string;
  };
  approach: string;
  stack: string[];
  impact: string;
  bestModel: {
    name: string;
    metric: string;
    value: string;
    subMetric?: string;
  };
  generalizationAnalysis?: string;
  businessRoi?: string;
  benchmarks?: ProjectBenchmark[];
  challenges?: string;
  keyInsights?: string[];
  liveUrl?: string;
  repoUrl: string;
  image: string;
  featured: boolean;
};

export type Certification = {
  id: string;
  name: string;
  issuer: string;
  level: "Foundational" | "Associate" | "Intermediate" | "Professional";
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  verifyUrl?: string;
  badgeImage?: string;
  certificateImage?: string; // full cert photo — click to open (lightbox/new tab)
  pdfUrl?: string;
  skills: string[];
  category: "AWS" | "Data Science" | "Analytics";
};

export type Experience = {
  id: string;
  role: string;
  company: string;
  type: "Full-time" | "Internship" | "Contract";
  location: string;
  startDate: string;
  endDate?: string;
  highlights: string[];
  skills: string[];
  logo?: string;
};

export type SkillGroup = {
  category: string;
  items: string[];
};

export type FAQ = {
  question: string;
  answer: string;
};
