import { AdminSidebar } from "@/components/admin/Sidebar";
import { MobileMenuButton } from "@/components/admin/MobileMenuButton";
import { Routes, Route } from "react-router-dom";
import { useState } from "react";
import Dashboard from "./Dashboard";
import Products from "./Products";
import CreateProduct from "./CreateProduct";
import ProductDetail from "./ProductDetail";
import EditProduct from "./EditProduct";
import Subjects from "./Subjects";
import CreateModule from "./CreateModule";
import Students from "./Students";
import { SubjectDetail } from "./SubjectDetail";
import { StudentDetail } from "./StudentDetail";
import Profile from "./Profile";

const Index = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar isOpen={isSidebarOpen} onToggle={setIsSidebarOpen} />
      <main className="flex-1 p-4 lg:p-8 overflow-auto">
        {/* Header móvil */}
        <div className="lg:hidden mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">EPEFI Admin</h1>
          <MobileMenuButton onClick={() => setIsSidebarOpen(true)} />
        </div>
        
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/create" element={<CreateProduct />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/products/:id/edit" element={<EditProduct />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/subjects/:id" element={<SubjectDetail />} />
          <Route path="/modules/create" element={<CreateModule />} />
          <Route path="/students" element={<Students />} />
          <Route path="/students/:id" element={<StudentDetail />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </div>
  );
};

export default Index;
