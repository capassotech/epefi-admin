import { AdminSidebar } from '@/components/admin/Sidebar';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<div>Products</div>} />
          <Route path="/products/create" element={<div>CreateProduct</div>} />
          <Route path="/products/:id" element={<div>ProductDetail</div>} />
          <Route path="/products/:id/edit" element={<div>EditProduct</div>} />
          <Route path="/students" element={<div>Students</div>} />
          <Route path="/students/:id" element={<div>StudentDetail</div>} />
        </Routes>
      </main>
    </div>
  );
};

export default Index;
