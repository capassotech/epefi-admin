// src/pages/admin/Dashboard.tsx
import { useEffect, useState } from "react";
import { DashboardStatsComponent } from "@/components/admin/DashboardStats";
import { ProductCard } from "@/components/product/ProductCard";
import { CoursesAPI } from "@/service/courses";
import { StudentsAPI } from "@/service/students";
import type { DashboardStats } from "@/types/types";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProducts: 0,
    totalRevenue: 0,
    activeUsers: 0,
    totalStudents: 0,
    popularProducts: [],
  });
  const [recentProducts, setRecentProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        // Obtener estudiantes
        const studentsCount = await StudentsAPI.getCount();

        // Obtener formaciones (cursos)
        const courses = await CoursesAPI.getAll();
        const coursesCount = courses?.length || 0;

        // Obtener las últimas 3 formaciones
        const latestCourses = courses?.slice(0, 3) || [];

        // Actualizar stats
        setStats({
          totalUsers: studentsCount,
          totalProducts: coursesCount,
          totalRevenue: 0,
          activeUsers: studentsCount,
          totalStudents: studentsCount,
          popularProducts: latestCourses.slice(0, 5),
        });

        setRecentProducts(latestCourses);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Acá tenés un resumen de todo.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Última actualización</p>
          <p className="text-sm font-medium">
            {new Date().toLocaleDateString("es-AR")}
          </p>
        </div>
      </div>

      {/* Stats */}
      <DashboardStatsComponent stats={stats} />

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Products */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Últimas Formaciones
            </h2>
            <a
              href="/products"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Ver todos →
            </a>
          </div>

          {recentProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No hay formaciones disponibles</p>
            </div>
          )}
        </div>

        {/* Activity Panel */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="admin-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Resumen Rápido
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Estudiantes</span>
                <span className="text-lg font-bold text-blue-600">
                  {stats.totalStudents}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Formaciones</span>
                <span className="text-lg font-bold text-green-600">
                  {stats.totalProducts}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Estudiantes Activos
                </span>
                <span className="text-lg font-bold text-purple-600">
                  {stats.activeUsers}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
