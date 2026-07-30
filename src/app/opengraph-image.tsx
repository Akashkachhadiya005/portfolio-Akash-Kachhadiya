import { ImageResponse } from "next/og";

export const alt = "Akash Kachhadiya — AI/ML Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Dynamically generated Open Graph image (no static file needed).
 * Shows up as the preview card on LinkedIn, WhatsApp, X, etc.
 */
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #003135 0%, #024950 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 24,
            color: "#0FA4AF",
            letterSpacing: 4,
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          Portfolio
        </div>
        <div
          style={{
            fontSize: 78,
            fontWeight: 700,
            color: "#F0FAFB",
            letterSpacing: -2,
          }}
        >
          Akash Kachhadiya
        </div>
        <div
          style={{
            fontSize: 38,
            color: "#AFDDE5",
            marginTop: 12,
          }}
        >
          AI/ML Engineer
        </div>
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 40,
          }}
        >
          {["AWS ML Engineer", "Solutions Architect", "AI Practitioner"].map((t) => (
            <div
              key={t}
              style={{
                fontSize: 20,
                color: "#0FA4AF",
                border: "2px solid rgba(15,164,175,0.4)",
                borderRadius: 999,
                padding: "8px 20px",
              }}
            >
              {t}
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 44,
            width: 120,
            height: 6,
            borderRadius: 999,
            background: "#964734",
          }}
        />
      </div>
    ),
    size,
  );
}
