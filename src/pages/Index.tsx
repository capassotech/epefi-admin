import { AdminSidebar } from '@/components/admin/Sidebar';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import Products from './Products';
import CreateProduct from './CreateProduct';
import ProductDetail from './ProductDetail';
import EditProduct from './EditProduct';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/create" element={<CreateProduct />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/products/:id/edit" element={<EditProduct />} />
          {/* <Route path="/students" element={<div>Students</div>} />
          <Route path="/students/:id" element={<div>StudentDetail</div>} /> */}
        </Routes>
      </main>
    </div>
  );
};

export default Index;
