import type { NavLink } from "@/types";

/**
 * Absolute hrefs (`/#section`) instead of bare hashes (`#section`).
 * This keeps the links working from ANY page — on `/projects` or
 * `/certifications` a bare `#about` would do nothing because that section
 * only exists on the home page.
 */
export const navLinks: NavLink[] = [
  { label: "About", href: "/#about" },
  { label: "Skills", href: "/#skills" },
  { label: "Projects", href: "/#projects" },
  { label: "Experience", href: "/#experience" },
  { label: "Certifications", href: "/#certifications" },
  { label: "Contact", href: "/#contact" },
];
