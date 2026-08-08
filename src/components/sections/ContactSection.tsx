"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import { Send, Mail, Phone } from "lucide-react";
import { siteConfig } from "@/data/site-config";
import { Button3D } from "@/components/ui/Button3D";
import { WhatsAppIcon } from "@/components/ui/BrandIcons";
import { cn } from "@/lib/utils";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  honeypot: z.string().max(0), // spam trap
});

type ContactFormData = z.infer<typeof contactSchema>;

/**
 * Builds the two ways a visitor can send the same message without the API.
 *
 * `mailto:` is handed to the OS, so an installed client (Outlook, Apple Mail,
 * Gmail on Android) opens with the draft already filled in. Where no client is
 * registered nothing visibly happens and no navigation occurs, which is why the
 * Gmail web compose URL is offered alongside it rather than instead of it — that
 * one works in any browser, signed in or not.
 */
function draftLinks(
  to: string,
  d: { name: string; email: string; subject: string; message: string },
) {
  const subject = `Portfolio: ${d.subject}`;
  const body = `${d.message}\n\n—\n${d.name}\n${d.email}`;
  const qs = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return {
    mailto: `mailto:${to}?${qs}`,
    gmail: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&${qs}`,
  };
}

export function ContactSection() {
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error" | "handoff"
  >("idle");
  // The server's own reason, so a misconfiguration says so instead of hiding
  // behind a generic "something went wrong".
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ mailto: string; gmail: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", subject: "", message: "", honeypot: "" },
  });

  async function onSubmit(data: ContactFormData) {
    setStatus("sending");
    setErrorMsg(null);
    setDraft(null);

    const handOff = (reason: string | null) => {
      const links = draftLinks(siteConfig.email, data);
      setDraft(links);
      setErrorMsg(reason);
      setStatus("handoff");
      // Ask the OS to open the visitor's own mail client with the draft ready.
      // An unregistered `mailto:` is a no-op — it does not navigate away or
      // error — so the on-screen Gmail link stays available either way.
      window.location.href = links.mailto;
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: data.message,
        }),
      });

      if (!res.ok) {
        const detail: unknown = await res.json().catch(() => null);
        const payload = detail as { error?: string; code?: string } | null;
        // The server could not deliver it (no API key, provider down). That is
        // not the visitor's problem, so the message goes out the other way
        // rather than showing them a dead end.
        if (payload?.code === "handoff") {
          handOff(payload.error ?? null);
          return;
        }
        throw new Error(payload?.error ?? `Request failed (${res.status})`);
      }

      setStatus("success");
      reset();
    } catch (err) {
      // A network failure is also a delivery failure — hand off rather than stop.
      if (err instanceof TypeError) {
        handOff("Network looks offline, so the draft is going to your mail app.");
        return;
      }
      setErrorMsg(err instanceof Error ? err.message : null);
      setStatus("error");
    }
  }

  return (
    <section id="contact" className="py-20 sm:py-28">
      <div className="page-shell-narrow">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-sm font-medium uppercase tracking-widest text-accent">
            Contact
          </h2>
          <p className="mt-2 text-3xl font-bold sm:text-4xl">Let&apos;s Connect</p>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Have a role or project in mind? Send me a message and I&apos;ll get back to
            you.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-10 lg:grid-cols-5 lg:gap-16">
          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5 lg:col-span-3"
          >
            {/* Honeypot (hidden spam trap) */}
            <input
              type="text"
              {...register("honeypot")}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            {/* Name and Email share a row from sm up; they stack on a phone
                where two 50% fields would be too cramped to type in. */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="text-sm font-medium text-foreground">
                  Name
                </label>
                <input
                  id="name"
                  autoComplete="name"
                  {...register("name")}
                  className={cn("form-field mt-1", errors.name && "form-field-error")}
                  placeholder="Your name"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register("email")}
                  className={cn("form-field mt-1", errors.email && "form-field-error")}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="text-sm font-medium text-foreground">
                Subject
              </label>
              <input
                id="subject"
                {...register("subject")}
                className={cn("form-field mt-1", errors.subject && "form-field-error")}
                placeholder="What is this about?"
              />
              {errors.subject && (
                <p className="mt-1 text-xs text-red-500">{errors.subject.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="message" className="text-sm font-medium text-foreground">
                Message
              </label>
              <textarea
                id="message"
                rows={5}
                {...register("message")}
                className={cn(
                  "form-field mt-1 resize-y",
                  errors.message && "form-field-error",
                )}
                placeholder="Tell me about your project or role..."
              />
              {errors.message && (
                <p className="mt-1 text-xs text-red-500">{errors.message.message}</p>
              )}
            </div>

            <Button3D
              type="submit"
              disabled={status === "sending"}
              className="w-full sm:w-auto"
            >
              {status === "sending" ? "Sending..." : "Send Message"}
              <Send className="h-4 w-4" aria-hidden="true" />
            </Button3D>

            {status === "success" && (
              <p className="text-sm font-medium text-accent">
                ✓ Message sent! I&apos;ll get back to you soon.
              </p>
            )}

            {status === "handoff" && draft && (
              <div
                className="rounded-xl border border-border bg-card/60 p-4"
                role="status"
              >
                <p className="text-sm font-medium text-foreground">
                  Your message is ready to send from your own mail.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {errorMsg ?? "Direct sending is unavailable right now."} Your mail app
                  should have opened with everything filled in — if it didn&apos;t, use
                  Gmail on the web.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={draft.gmail}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-accent hover:text-accent"
                  >
                    <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                    Open in Gmail
                  </a>
                  <a
                    href={draft.mailto}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-accent hover:text-accent"
                  >
                    <Send className="h-3.5 w-3.5" aria-hidden="true" />
                    Open in mail app
                  </a>
                </div>
              </div>
            )}

            {status === "error" && (
              <p className="text-sm font-medium text-red-500" role="alert">
                {errorMsg ??
                  "Something went wrong. Please try again or email me directly."}
              </p>
            )}
          </motion.form>

          {/* Contact info sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-5 lg:col-span-2"
          >
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 text-accent" />
              <div>
                <p className="text-sm font-medium text-foreground">Email</p>
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="text-sm text-muted-foreground hover:text-accent transition-colors"
                >
                  {siteConfig.email}
                </a>
              </div>
            </div>

            {siteConfig.phone && (
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 text-accent" />
                <div>
                  <p className="text-sm font-medium text-foreground">Phone (Call)</p>
                  <a
                    href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
                    className="text-sm text-muted-foreground hover:text-accent transition-colors"
                  >
                    {siteConfig.phone}
                  </a>
                </div>
              </div>
            )}

            {siteConfig.whatsapp && (
              <div className="flex items-start gap-3">
                <WhatsAppIcon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <div>
                  <p className="text-sm font-medium text-foreground">WhatsApp</p>
                  <a
                    href={`https://wa.me/${siteConfig.whatsapp.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-accent transition-colors"
                  >
                    {siteConfig.whatsapp}
                  </a>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
