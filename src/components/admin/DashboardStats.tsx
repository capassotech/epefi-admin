// src/components/admin/DashboardStats.tsx
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const tones = {
  blue: "bg-blue-50 text-blue-600",
  violet: "bg-violet-50 text-violet-600",
  orange: "bg-orange-50 text-orange-600",
  amber: "bg-amber-50 text-amber-600",
} as const;

export type StatCardData = {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone: keyof typeof tones;
  href: string;
  /** Resalta la tarjeta cuando requiere atención (ej: exámenes por corregir) */
  highlight?: boolean;
};

export function DashboardStatsComponent({ cards }: { cards: StatCardData[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Link
          key={card.label}
          to={card.href}
          className={cn(
            "group relative rounded-xl border bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gray-200/60",
            card.highlight ? "border-amber-200 bg-amber-50/30" : "border-gray-200/70"
          )}
          style={{
            animation: "fadeInUp 0.5s ease-out both",
            animationDelay: `${index * 60}ms`,
          }}
        >
          <div className="flex items-center justify-between">
            <span className={cn("grid place-items-center w-9 h-9 rounded-lg", tones[card.tone])}>
              <card.icon className="w-[18px] h-[18px]" />
            </span>
            <ChevronRight className="w-4 h-4 text-gray-300 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </div>
          <p className="mt-4 text-xs font-medium uppercase tracking-wide text-gray-500">{card.label}</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-gray-900 tabular-nums">{card.value}</p>
          <p className={cn("mt-1 text-xs", card.highlight ? "text-amber-700" : "text-gray-500")}>
            {card.hint}
          </p>
        </Link>
      ))}
    </div>
  );
}
