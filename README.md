# Akash Kachhadiya — Portfolio

Personal portfolio website for **Akash Kachhadiya**, AI/ML Engineer.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4
- **Animation:** Motion (formerly Framer Motion) + GSAP
- **3D:** React Three Fiber + Three.js
- **Theme:** Light / Dark / Auto (next-themes)
- **Contact:** react-hook-form + zod + Resend
- **Hosting:** Vercel (free)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy `.env.example` to `.env.local` and fill in real values:

```bash
cp .env.example .env.local
```

## Deploy

Push to GitHub → Import on Vercel → Add env vars → Deploy.

## Structure

```
src/
├── app/          # Routes + layouts
├── components/   # sections/ ui/ layout/ three/ animations/
├── data/         # All content (data-driven)
├── lib/          # Utilities
├── hooks/        # Custom hooks
└── types/        # Shared TypeScript types
```

## License

MIT
