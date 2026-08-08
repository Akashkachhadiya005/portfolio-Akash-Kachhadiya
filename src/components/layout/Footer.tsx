import Link from "next/link";
import { Mail, ArrowUp, Phone } from "lucide-react";
import { siteConfig } from "@/data/site-config";
import { navLinks } from "@/data/navigation";
import { GithubIcon, LinkedinIcon, WhatsAppIcon } from "@/components/ui/BrandIcons";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="page-shell py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <p className="text-lg font-bold text-foreground">{siteConfig.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{siteConfig.title}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {siteConfig.currentLocation}
            </p>
          </div>

          {/* Quick links */}
          <div>
            <p className="text-sm font-semibold text-foreground">Quick Links</p>
            <ul className="mt-2 space-y-1.5">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-sm font-semibold text-foreground">Contact</p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              <li>
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="hover:text-foreground transition-colors"
                >
                  {siteConfig.email}
                </a>
              </li>
              {siteConfig.phone && <li>{siteConfig.phone} (Call)</li>}
              {siteConfig.whatsapp && <li>{siteConfig.whatsapp} (WhatsApp)</li>}
            </ul>
          </div>

          {/* Socials */}
          <div>
            <p className="text-sm font-semibold text-foreground">Connect</p>
            <div className="mt-2 flex gap-3">
              <a
                href={siteConfig.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="social-dot"
              >
                <GithubIcon className="h-5 w-5" />
              </a>
              <a
                href={siteConfig.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="social-dot"
              >
                <LinkedinIcon className="h-5 w-5" />
              </a>
              <a
                href={`mailto:${siteConfig.email}`}
                aria-label="Email"
                className="social-dot"
              >
                <Mail className="h-5 w-5" />
              </a>
              {/* tel: opens the dialer; the number is stripped of spaces because
                  tel: URIs must not contain whitespace. */}
              {siteConfig.phone && (
                <a
                  href={`tel:${siteConfig.phone.replace(/[^\d+]/g, "")}`}
                  aria-label={`Call ${siteConfig.phone}`}
                  className="social-dot"
                >
                  <Phone className="h-5 w-5" />
                </a>
              )}
              {/* wa.me needs the number in international form with no +, spaces
                  or dashes, otherwise WhatsApp shows "number not valid". */}
              {siteConfig.whatsapp && (
                <a
                  href={`https://wa.me/${siteConfig.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`WhatsApp ${siteConfig.whatsapp}`}
                  className="social-dot"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {currentYear} {siteConfig.name}. All rights reserved.
          </p>
          <Link
            href="/#hero"
            aria-label="Back to top"
            className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          >
            <ArrowUp className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
