"use client";

import { useEffect, useRef, useState } from "react";
import { orbitRings } from "@/data/tech-logos";
import { cn } from "@/lib/utils";

const BASE_ROT_X = 62;

type Particle = {
  id: number;
  top: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
};

/**
 * Premium 3D Orbital Tech System.
 *
 * PERFORMANCE: All animation is done via direct DOM transform writes inside a
 * single requestAnimationFrame loop — ZERO React re-renders. This keeps it
 * buttery smooth even while scrolling/dragging the page.
 */
export function TechOrbit({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const outerRing1Ref = useRef<HTMLDivElement>(null);
  const outerRing2Ref = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);

  // Refs to each orbiting logo element + its ring metadata
  const logoRefs = useRef<
    { el: HTMLDivElement | null; ringTilt: number; radius: number; speed: number; offset: number }[]
  >([]);

  const tiltRef = useRef({ x: 0, y: 0 });
  const targetTiltRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const visibleRef = useRef(true);

  // Ambient particles — generated CLIENT-SIDE ONLY (avoids hydration mismatch)
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: 1.5 + Math.random() * 2.5,
        delay: Math.random() * 5,
        duration: 3 + Math.random() * 4,
      })),
    );
  }, []);

  // Pause rendering when off-screen (perf)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.05 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Single rAF loop — writes transforms directly to DOM
  useEffect(() => {
    let angle = 0;
    let last = performance.now();

    function frame(now: number) {
      const dt = Math.min(now - last, 50); // clamp on tab-switch
      last = now;

      if (visibleRef.current) {
        angle = (angle + dt * 0.03) % 360000;

        // Smooth tilt easing toward target
        tiltRef.current.x += (targetTiltRef.current.x - tiltRef.current.x) * 0.08;
        tiltRef.current.y += (targetTiltRef.current.y - tiltRef.current.y) * 0.08;
        const tx = tiltRef.current.x;
        const ty = tiltRef.current.y;

        // Stage tilt
        if (stageRef.current) {
          stageRef.current.style.transform = `rotateX(${BASE_ROT_X + tx}deg) rotateZ(${ty}deg)`;
        }

        // Decorative outer rings
        if (outerRing1Ref.current) {
          outerRing1Ref.current.style.transform = `rotate(${angle * 0.15}deg)`;
        }
        if (outerRing2Ref.current) {
          outerRing2Ref.current.style.transform = `rotate(${-angle * 0.25}deg)`;
        }
        if (haloRef.current) {
          haloRef.current.style.transform = `rotate(${angle * 0.6}deg)`;
        }

        // Counter-rotate core so it always faces viewer
        if (coreRef.current) {
          coreRef.current.style.transform = `translate(-50%, -50%) rotateX(${-(BASE_ROT_X + tx)}deg) rotateZ(${-ty}deg)`;
        }

        // Orbiting logos
        for (const item of logoRefs.current) {
          if (!item?.el) continue;
          const a = ((angle * item.speed + item.offset) * Math.PI) / 180;
          const x = Math.cos(a) * item.radius;
          const y = Math.sin(a) * item.radius;
          item.el.style.transform =
            `translate3d(${x}px, ${y}px, 0) ` +
            `rotateX(${-item.ringTilt}deg) rotateX(${-(BASE_ROT_X + tx)}deg) rotateZ(${-ty}deg)`;
        }
      }

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    targetTiltRef.current = { x: py * 22, y: px * 30 };
  }

  // Build a flat registry of logos with their ring metadata
  let logoIndex = 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => (targetTiltRef.current = { x: 0, y: 0 })}
      className={cn(
        "relative flex h-[540px] w-full max-w-[540px] items-center justify-center",
        className,
      )}
      style={{ perspective: "1400px" }}
    >
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[400px] w-[400px] rounded-full bg-accent/10 blur-3xl" />
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[220px] w-[220px] rounded-full bg-primary/15 blur-3xl" />
      </div>

      {/* Ambient particles (pure CSS animation) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute rounded-full bg-accent/60 animate-pulse"
            style={{
              top: `${p.top}%`,
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Decorative outer rings */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          ref={outerRing1Ref}
          className="h-[500px] w-[500px] rounded-full border border-dashed border-accent/20"
          style={{ willChange: "transform" }}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          ref={outerRing2Ref}
          className="h-[450px] w-[450px] rounded-full border border-accent/10"
          style={{ willChange: "transform" }}
        />
      </div>

      {/* 3D stage */}
      <div
        ref={stageRef}
        className="relative h-full w-full"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${BASE_ROT_X}deg)`,
          willChange: "transform",
        }}
      >
        {orbitRings.map((ring) => (
          <div
            key={ring.label}
            className="absolute left-1/2 top-1/2"
            style={{
              transformStyle: "preserve-3d",
              transform: `translate(-50%, -50%) rotateX(${ring.tilt}deg)`,
            }}
          >
            {/* Glowing orbit path */}
            <div
              className="absolute rounded-full border-2 border-accent/30"
              style={{
                width: ring.radius * 2,
                height: ring.radius * 2,
                left: -ring.radius,
                top: -ring.radius,
                boxShadow:
                  "0 0 25px rgba(15,164,175,0.25), inset 0 0 25px rgba(15,164,175,0.08)",
              }}
            />
            <div
              className="absolute rounded-full border border-accent/10"
              style={{
                width: ring.radius * 2 - 10,
                height: ring.radius * 2 - 10,
                left: -ring.radius + 5,
                top: -ring.radius + 5,
              }}
            />

            {/* Orbiting logos */}
            {ring.techs.map((tech, i) => {
              const offset = (360 / ring.techs.length) * i;
              const idx = logoIndex++;
              return (
                <div
                  key={tech.name}
                  ref={(el) => {
                    logoRefs.current[idx] = {
                      el,
                      ringTilt: ring.tilt,
                      radius: ring.radius,
                      speed: ring.speed,
                      offset,
                    };
                  }}
                  className="group absolute"
                  style={{
                    transformStyle: "preserve-3d",
                    left: -26,
                    top: -26,
                    willChange: "transform",
                  }}
                >
                  <div className="relative">
                    {/* Glow halo */}
                    <div className="absolute inset-0 rounded-2xl bg-accent/25 blur-lg transition-all duration-200 group-hover:bg-accent/60 group-hover:blur-xl" />
                    {/* Logo tile */}
                    <div className="relative flex items-center justify-center rounded-2xl border border-accent/40 bg-card p-2 shadow-xl transition-transform duration-200 group-hover:scale-125"
                      style={{ width: 52, height: 52 }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={tech.src}
                        alt={tech.name}
                        className="h-full w-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    {/* Tooltip */}
                    <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-0.5 text-[10px] font-semibold text-background opacity-0 transition-opacity group-hover:opacity-100">
                      {tech.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Energy core */}
        <div
          ref={coreRef}
          className="absolute left-1/2 top-1/2"
          style={{
            transformStyle: "preserve-3d",
            transform: `translate(-50%, -50%) rotateX(${-BASE_ROT_X}deg)`,
            willChange: "transform",
          }}
        >
          <div className="relative flex h-24 w-24 items-center justify-center">
            <div className="absolute h-full w-full animate-ping rounded-full border-2 border-primary/40" />
            <div
              className="absolute h-20 w-20 animate-ping rounded-full border border-accent/40"
              style={{ animationDelay: "0.7s" }}
            />
            <div className="absolute h-20 w-20 rounded-full bg-primary/40 blur-xl" />
            <div
              ref={haloRef}
              className="absolute h-[74px] w-[74px] rounded-full border-2 border-dashed border-primary/50"
              style={{ willChange: "transform" }}
            />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-2xl ring-4 ring-primary/20">
              <span className="text-sm font-bold tracking-tight text-primary-foreground">
                AI
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
