// src/components/admin/DashboardStats.tsx
import { type DashboardStats } from "@/types/types";
import { Users, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

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
      gradient: "from-blue-50 to-blue-50/50",
      iconBg: "bg-blue-100/80",
      iconColor: "text-blue-600",
      borderColor: "border-blue-200/50",
      hoverShadow: "hover:shadow-blue-100/50",
      href: "/students",
    },
    {
      title: "Cursos",
      value: stats.totalProducts.toString(),
      subtitle: "Total de cursos",
      icon: BookOpen,
      gradient: "from-purple-50 to-purple-50/50",
      iconBg: "bg-purple-100/80",
      iconColor: "text-purple-600",
      borderColor: "border-purple-200/50",
      hoverShadow: "hover:shadow-purple-100/50",
      href: "/products",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {statCards.map((card, index) => (
        <Link
          key={card.title}
          to={card.href}
          className={`group relative overflow-hidden rounded-xl border ${card.borderColor} bg-white hover:shadow-xl ${card.hoverShadow} hover:border-opacity-100 transition-all duration-500 cursor-pointer active:scale-[0.98]`}
          style={{ 
            animationDelay: `${index * 100}ms`,
            animation: 'fadeInUp 0.5s ease-out forwards',
            opacity: 0
          }}
        >
          {/* Subtle gradient background */}
          <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
          
          <div className="relative p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  {card.title}
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold text-gray-900 tracking-tight">
                    {card.value}
                  </p>
                </div>
                <p className="text-sm text-gray-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                  {card.subtitle}
                </p>
              </div>
              <div className={`flex-shrink-0 w-14 h-14 rounded-xl ${card.iconBg} ${card.iconColor} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                <card.icon className="w-7 h-7" strokeWidth={2} />
              </div>
            </div>
            
            {/* Arrow indicator */}
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
