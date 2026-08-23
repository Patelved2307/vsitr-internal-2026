"use client";

import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

interface GlowingShadowProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  cardColor?: string;
  radius?: number;
}

export function GlowingShadow({
  children,
  cardColor = "#ffffff",
  radius = 16,
  className,
  style,
  ...props
}: GlowingShadowProps) {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const cls = `glow-card-${uid}`;

  const css = `
.${cls} {
  --card-color: ${cardColor};
  --card-radius: ${radius}px;
  --border-width: 2px;
  --glow-scale: 1.15;
  --glow-opacity: 0.14;
  --glow-blur: 20px;

  width: 100%;
  position: relative;
  z-index: 2;
  border-radius: var(--card-radius);
  padding: var(--border-width);
  background: linear-gradient(135deg, #C1272D, #8B235E, #1B3F8B);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
}

.${cls}:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px -10px rgba(27, 63, 139, 0.15);
}

.${cls} .glow-content {
  position: relative;
  z-index: 10;
  background: var(--card-color);
  border-radius: calc(var(--card-radius) - var(--border-width));
  width: 100%;
  height: 100%;
  padding: 1.25rem;
  overflow: hidden;
}

/* Glowing shadow cast behind the card using brand colors */
.${cls} .glow-blob {
  position: absolute;
  inset: -10%;
  z-index: -1;
  pointer-events: none;
  background: linear-gradient(135deg, #C1272D, #8B235E, #1B3F8B);
  filter: blur(var(--glow-blur));
  opacity: var(--glow-opacity);
  border-radius: var(--card-radius);
  transform: scale(var(--glow-scale));
  animation: rotate-glow-${cls} 15s linear infinite;
  transition: opacity 0.3s ease, filter 0.3s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.${cls}:hover .glow-blob {
  --glow-opacity: 0.24;
  --glow-scale: 1.25;
  filter: blur(24px);
}

@keyframes rotate-glow-${cls} {
  from {
    transform: rotate(0deg) scale(var(--glow-scale));
  }
  to {
    transform: rotate(360deg) scale(var(--glow-scale));
  }
}
`.trim();

  return (
    <div
      className={cn("glow-container", cls, className)}
      style={{
        borderRadius: `${radius}px`,
        ...style,
      }}
      {...props}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <span className="glow-blob" aria-hidden="true"></span>
      <div className="glow-content">{children}</div>
    </div>
  );
}
