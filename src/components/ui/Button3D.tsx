"use client";

import { cn } from "@/lib/utils";
import { useSurfaceTilt } from "@/lib/use-surface-tilt";

/**
 * The portfolio's primary control surface.
 *
 * "3D" is geometry alone. This layers the five things that actually make a
 * surface feel physically present, and the pointer drives all of them:
 *
 *  1. GEOMETRY  — real perspective tilt. The face rotates toward the cursor, so
 *                 the button has orientation, not just a drop shadow.
 *  2. LIGHT     — a specular hotspot tracks the cursor across the glass, and a
 *                 rim light picks out the edge that has tilted into view.
 *  3. PARALLAX  — the label sits forward in Z, so it shifts against the base as
 *                 the face turns. Depth you can see, from a flat DOM node.
 *  4. SIGNAL    — a single bright packet runs the border on hover: a conic
 *                 gradient masked to a 1.5px ring. Reads as current moving
 *                 through a trace, which is the right metaphor for this site.
 *  5. TOUCH     — the cap travels down into its base on press, a ripple expands
 *                 from the exact point that was hit, and a shockwave ring pushes
 *                 out past the edge.
 *
 * PERFORMANCE: `useSurfaceTilt` writes four CSS custom properties per pointer
 * move and nothing else. The trace is one rotating element, the shockwave one
 * keyframe. No per-frame JavaScript, no React state, no re-render.
 *
 * ACCESSIBILITY: renders a real <button> or <a>, so keyboard and screen-reader
 * behaviour is native. Tilt is pointer-only and never required to operate the
 * control, and `prefers-reduced-motion` drops the motion in CSS while keeping
 * the depth cues.
 */

type Base = {
  variant?: "primary" | "neutral";
  className?: string;
  children: React.ReactNode;
};

type AnchorProps = Base &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof Base> & { href: string };

type ButtonProps = Base &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof Base> & { href?: undefined };

export function Button3D(props: AnchorProps | ButtonProps) {
  const { variant = "primary", className, children, ...rest } = props;
  const { setRef, tiltProps } = useSurfaceTilt<HTMLElement>({
    maxTiltDeg: 9,
    ripple: true,
  });

  const shared = {
    ...tiltProps,
    className: cn("btn5", variant === "neutral" && "btn5-neutral", className),
  };

  const inner = (
    <>
      <span className="btn5-trace" aria-hidden="true" />
      <span className="btn5-label">{children}</span>
    </>
  );

  if ("href" in props && props.href !== undefined) {
    const anchorRest = rest as React.AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <a {...anchorRest} {...shared} ref={setRef} href={props.href}>
        {inner}
      </a>
    );
  }

  const buttonRest = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button {...buttonRest} {...shared} ref={setRef}>
      {inner}
    </button>
  );
}
