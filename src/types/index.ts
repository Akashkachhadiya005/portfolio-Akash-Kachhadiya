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
  resumePath: string;
};

export type NavLink = {
  label: string;
  href: string;
};

export type Project = {
  slug: string;
  title: string;
  problem: string;
  approach: string;
  stack: string[];
  impact: string;
  challenges?: string;
  liveUrl?: string;
  repoUrl?: string;
  image?: string;
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
