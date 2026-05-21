"use client";

import { useState } from "react";

type BentoCardProps = {
  title: string;
  children: React.ReactNode;
};

export function BentoCard({ title, children }: BentoCardProps) {
  const [position, setPosition] = useState({ x: 50, y: 50 });

  return (
    <article
      className="group relative overflow-hidden rounded-lg border border-zinc-800 bg-[#0A0A0A] p-6"
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setPosition({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        });
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(420px circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.09), transparent 42%)`
        }}
      />
      <div className="relative">
        <h3 className="text-base font-medium text-white">{title}</h3>
        <div className="mt-3 text-sm leading-6 text-zinc-500">{children}</div>
      </div>
    </article>
  );
}
