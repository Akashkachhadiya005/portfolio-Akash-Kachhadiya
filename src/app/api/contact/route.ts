import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json();

    // Basic server-side validation
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    if (message.length < 10) {
      return NextResponse.json(
        { error: "Message too short" },
        { status: 400 },
      );
    }

    // TODO: Integrate Resend when RESEND_API_KEY is set
    // For now, log and return success (replace with actual email sending)
    const apiKey = process.env.RESEND_API_KEY;

    if (apiKey) {
      // Resend integration (uncomment when ready):
      // const { Resend } = await import("resend");
      // const resend = new Resend(apiKey);
      // await resend.emails.send({
      //   from: process.env.CONTACT_FROM_EMAIL || "onboarding@resend.dev",
      //   to: process.env.CONTACT_TO_EMAIL || "akashkachhadiya55@gmail.com",
      //   subject: `Portfolio Contact: ${name}`,
      //   text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      // });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
