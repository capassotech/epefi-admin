import { AdminSidebar } from "@/components/admin/Sidebar";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./Dashboard";
import Products from "./Products";
import CreateProduct from "./CreateProduct";
import ProductDetail from "./ProductDetail";
import EditProduct from "./EditProduct";
import Subjects from "./Subjects";
import CreateModule from "./CreateModule";
import Students from "./Students";
import { SubjectDetail } from "./SubjectDetail";

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
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/subjects/:id" element={<SubjectDetail />} />
          <Route path="/modules/create" element={<CreateModule />} />
          <Route path="/students" element={<Students />} />{" "}
          {/* ← AGREGAR ESTA LÍNEA */}
        </Routes>
      </main>
    </div>
  );
};

export default Index;
