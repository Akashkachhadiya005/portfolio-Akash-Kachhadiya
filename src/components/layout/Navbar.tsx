"use client";

import { useState, useEffect } from "react";
import { Menu, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { navLinks } from "@/data/navigation";
import { siteConfig } from "@/data/site-config";
import { Button3D } from "@/components/ui/Button3D";
import { ThemeToggle } from "./ThemeToggle";
import { LogoShell } from "./LogoShell";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/98 border-b border-border/80 shadow-sm backdrop-blur-md"
          : "bg-background/60 border-b border-border/30 backdrop-blur-md",
      )}
    >
      {/* bar-shell has NO max-width — that is what keeps the logo pinned to the
          far left and the controls to the far right when the page is zoomed
          out. A max-w container pulled them both into the middle. */}
      <nav className="bar-shell h-16">
        {/* Logo / Name — click smooth-scrolls to top on home, navigates to / from other pages */}
        <button
          type="button"
          aria-label="Akash Kachhadiya — back to top"
          className="flex items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded-[0.6rem]"
          onClick={() => {
            if (window.location.pathname === "/") {
              window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
              window.location.href = "/#hero";
            }
          }}
        >
          <LogoShell />

        </button>

        {/* Desktop links */}
        <ul className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Right side: Resume + Theme + Mobile toggle */}
        <div className="flex items-center gap-3">
          {siteConfig.resumePath && (
            <Button3D
              href={siteConfig.resumePath}
              target="_blank"
              rel="noopener noreferrer"
              /* h-9 matches the ThemeToggle's height so the two controls sit on
                 one optical line, and the pill radius matches it too. */
              className="hidden h-9 px-4 sm:inline-flex"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              Resume
            </Button3D>
          )}

          <ThemeToggle />

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className="btn-3d-neutral grid h-9 w-9 place-items-center text-foreground lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-background/98">
          <ul className="flex flex-col gap-1 px-4 py-4">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-md px-3 py-2.5 text-base font-medium text-foreground hover:bg-muted transition-colors"
                >
                  {link.label}
                </a>
              </li>
            ))}
            {siteConfig.resumePath && (
              <li>
                <Button3D
                  href={siteConfig.resumePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                  className="mt-2 flex w-full"
                >
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  Resume
                </Button3D>
              </li>
            )}
          </ul>
        </div>
      )}
    </header>
  );
}
