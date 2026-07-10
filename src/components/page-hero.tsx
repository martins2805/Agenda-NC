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
    <section className="hero-banner p-6 sm:p-10">
      <span className="hero-pill">
        {icon}
        {label}
      </span>
      <h1 className="mt-5 font-display text-4xl leading-[1.05] font-semibold tracking-tight text-foreground italic sm:text-6xl">
        {title}
      </h1>
      <div className="mt-4 h-px w-16 bg-primary" />
      <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
        {description}
      </p>
    </section>
  );
}
