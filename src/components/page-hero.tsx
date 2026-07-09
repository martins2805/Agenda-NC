import type { ReactNode } from "react";

export function PageHero({
  icon,
  label,
  title,
  description,
}: {
  icon: ReactNode;
  label: string;
  title: string;
  description: string;
}) {
  return (
    <section className="hero-banner p-6 sm:p-8">
      <span className="hero-pill">
        {icon}
        {label}
      </span>
      <h1 className="mt-4 text-3xl font-black leading-[0.95] tracking-tight sm:text-5xl">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-blue-100/90">
        {description}
      </p>
    </section>
  );
}
