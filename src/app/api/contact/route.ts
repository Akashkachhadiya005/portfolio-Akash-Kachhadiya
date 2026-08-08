import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Contact form endpoint.
 *
 * This used to validate loosely and then return `{ success: true }` with the
 * Resend call commented out — so the form reported "sent" and nothing was ever
 * delivered. It now actually sends, and it fails loudly if it cannot.
 *
 * Input is re-validated here with zod even though the client already did:
 * anything can POST to this route, and the client is not a trust boundary.
 */

const ContactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  subject: z.string().trim().min(3).max(150),
  message: z.string().trim().min(10).max(5000),
});

/** Strips CR/LF so user input cannot inject extra email headers. */
function headerSafe(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

export async function POST(request: Request) {
  let parsed: z.infer<typeof ContactSchema>;

  try {
    const body: unknown = await request.json();
    const result = ContactSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }
    parsed = result.data;
  } catch {
    return NextResponse.json({ error: "Malformed request body" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL ?? "onboarding@resend.dev";

  // Fail honestly rather than reporting a success that did not happen
  if (!apiKey || !to) {
    console.error("[contact] RESEND_API_KEY or CONTACT_TO_EMAIL is not configured");
    return NextResponse.json(
      {
        // `code` lets the client fall back to a prefilled draft in the visitor's
        // own mail client instead of dead-ending on an error message.
        code: "handoff",
        error: "Email is not configured on the server yet. Please email me directly.",
      },
      { status: 503 },
    );
  }

  try {
    // Resend's REST endpoint directly, rather than the `resend` SDK.
    // The SDK dynamically imports `@react-email/render` for its React-email
    // feature; Turbopack resolves that import statically and the build fails on
    // a package we would never use, since this email is plain text. One fetch
    // removes the dependency, the bundle weight and the build failure at once.
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: parsed.email,
        subject: headerSafe(`Portfolio: ${parsed.subject}`),
        text: [
          `Name:    ${parsed.name}`,
          `Email:   ${parsed.email}`,
          `Subject: ${parsed.subject}`,
          "",
          parsed.message,
        ].join("\n"),
      }),
    });

    if (!res.ok) {
      // Log the provider's reason server-side; never leak it to the client
      const detail = await res.text().catch(() => "");
      console.error(`[contact] Resend returned ${res.status}: ${detail}`);
      return NextResponse.json(
        {
          code: "handoff",
          error: "Could not send right now. Please try again or email me directly.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[contact] Unexpected failure:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
