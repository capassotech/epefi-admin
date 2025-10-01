// src/pages/admin/Dashboard.tsx
import { useEffect, useState } from 'react';
import { DashboardStatsComponent } from '@/components/admin/DashboardStats';
import { ProductCard } from '@/components/product/ProductCard';
import { CoursesAPI } from '@/service/courses';
import { StudentsAPI } from '@/service/students';
import type { DashboardStats } from '@/types/types';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProducts: 0,
    totalRevenue: 0,
    activeUsers: 0,
    totalStudents: 0,
    popularProducts: []
  });
  const [recentProducts, setRecentProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        // Obtener estudiantes
        const studentsCount = await StudentsAPI.getCount();

        // Obtener cursos
        const courses = await CoursesAPI.getAll();
        const coursesCount = courses?.length || 0;

        // Obtener las últimas 4 formaciones
        const latestCourses = courses?.slice(0, 4) || [];

        // Actualizar stats
        setStats({
          totalUsers: studentsCount,
          totalProducts: coursesCount,
          totalRevenue: 0,
          activeUsers: studentsCount,
          totalStudents: studentsCount,
          popularProducts: latestCourses.slice(0, 5)
        });

        setRecentProducts(latestCourses);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
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
          <p className="text-gray-600 mt-2">
            Acá tenés un resumen de todo.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Última actualización</p>
          <p className="text-sm font-medium">{new Date().toLocaleDateString('es-AR')}</p>
        </div>
      </div>

      {/* Stats */}
      <DashboardStatsComponent stats={stats} />

      {/* Recent Products */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Últimos Cursos</h2>
          <a href="/products" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            Ver todos →
          </a>
        </div>
        
        {recentProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No hay cursos disponibles</p>
          </div>
        )}
      </div>
    </div>
  );
}