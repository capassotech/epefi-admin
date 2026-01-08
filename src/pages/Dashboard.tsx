// src/pages/admin/Dashboard.tsx
import { useEffect, useState } from 'react';
import { DashboardStatsComponent } from '@/components/admin/DashboardStats';
import { ProductCard } from '@/components/product/ProductCard';
import { CoursesAPI } from '@/service/courses';
import { StudentsAPI } from '@/service/students';
import type { DashboardStats } from '@/types/types';
import { InteractiveLoader } from '@/components/ui/InteractiveLoader';
import { TourButton } from '@/components/tour/TourButton';
import { dashboardTourSteps } from '@/config/tourSteps';

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

        // Obtener todos los usuarios y filtrar solo los que tienen rol de estudiante
        const allUsers = await StudentsAPI.getAll();
        const studentsData = Array.isArray(allUsers) ? allUsers : [];
        
        // Filtrar solo usuarios con rol de estudiante
        const studentsWithStudentRole = studentsData.filter((user: any) => 
          user.role?.student === true
        );
        
        const studentsCount = studentsWithStudentRole.length;
        
        // Contar estudiantes activos (que tienen rol de estudiante y están activos)
        const activeStudentsCount = studentsWithStudentRole.filter((user: any) => 
          user.activo !== false // Considerar activos si activo es true o undefined
        ).length;

        // Obtener cursos
        const courses = await CoursesAPI.getAll();
        const coursesCount = courses?.length || 0;

        // Obtener los últimos 4 cursos
        const latestCourses = courses?.slice(0, 4) || [];

        // Actualizar stats
        setStats({
          totalUsers: studentsCount,
          totalProducts: coursesCount,
          totalRevenue: 0,
          activeUsers: activeStudentsCount,
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
      <InteractiveLoader
        initialMessage="Cargando dashboard"
        delayedMessage="Conectándose con el servidor, esto puede tomar unos minutos"
      />
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-2 border-b border-gray-100">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 text-base">
            Resumen general de tu plataforma
          </p>
        </div>
        <div className="flex items-center gap-3 text-right sm:text-left">
          <TourButton steps={dashboardTourSteps} />
          <div className="hidden sm:block w-px h-8 bg-gray-200"></div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Última actualización</p>
            <p className="text-sm font-semibold text-gray-700 mt-0.5">{new Date().toLocaleDateString('es-AR', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div data-tour="dashboard-stats">
        <DashboardStatsComponent stats={stats} />
      </div>

      {/* Recent Products */}
      <div className="space-y-6" data-tour="recent-courses">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Últimos Cursos</h2>
            <p className="text-sm text-gray-500 mt-1">Cursos agregados recientemente</p>
          </div>
          <a 
            href="/products" 
            className="hidden sm:flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors duration-200 group"
          >
            Ver todos
            <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
          </a>
        </div>
        
        {recentProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentProducts.map((product, index) => (
              <div
                key={product.id}
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeInUp 0.5s ease-out forwards',
                  opacity: 0
                }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-200/50">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-200/50 mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No hay cursos disponibles</p>
            <p className="text-sm text-gray-400 mt-1">Agrega tu primer curso para comenzar</p>
          </div>
        )}
      </div>
    </div>
  );
}