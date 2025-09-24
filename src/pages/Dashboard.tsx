
import { DashboardStatsComponent } from '@/components/admin/DashboardStats';
import { ProductCard } from '@/components/product/ProductCard';
import { mockDashboardStats, mockProducts } from '@/data/mockData';
import { Video, Videotape } from 'lucide-react';

export default function Dashboard() {
  const recentProducts = mockProducts.slice(0, 3);

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
          <p className="text-sm font-medium">{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Stats */}
      <DashboardStatsComponent stats={mockDashboardStats} />

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Products */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Últimas Formaciones</h2>
            <a href="/products" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Ver todos →
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        </div>

        {/* Activity Panel */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <div className="admin-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Próximos Eventos</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                <Video className="w-4 h-4 text-red-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">Gestión financiera para pequeñas empresas</p>
                  <p className="text-xs text-red-600">15 Julio, 19:00</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                <Videotape className="w-4 h-4 text-purple-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-purple-900">Marketing Digital Estratégico</p>
                  <p className="text-xs text-purple-600">20 Julio, 18:00</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}