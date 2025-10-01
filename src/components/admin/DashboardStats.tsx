// src/components/admin/DashboardStats.tsx
import { type DashboardStats } from "@/types/types";
import { Users, BookOpen } from "lucide-react";

interface DashboardStatsProps {
  stats: DashboardStats;
}

export function DashboardStatsComponent({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      title: "Estudiantes",
      value: stats.totalUsers.toLocaleString(),
      subtitle: `${stats.activeUsers.toLocaleString()} activos`,
      icon: Users,
      color: "blue",
    },
    {
      title: "Formaciones",
      value: stats.totalProducts.toString(),
      subtitle: "Total de formaciones",
      icon: BookOpen,
      color: "purple",
    },
  ];

  const colorClasses = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    subtle: "bg-slate-50 text-slate-700 border-slate-200",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((card, index) => (
        <div
          key={card.title}
          className="admin-card p-6 hover:shadow-lg transition-all duration-300 animate-fade-in"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">
                {card.title}
              </p>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {card.value}
              </p>
              <p className="text-xs text-gray-500">{card.subtitle}</p>
            </div>
            <div
              className={`w-12 h-12 rounded-xl border ${
                colorClasses[card.color as keyof typeof colorClasses]
              } flex items-center justify-center`}
            >
              <card.icon className="w-6 h-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
