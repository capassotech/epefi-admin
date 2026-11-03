import { AdminSidebar } from "@/components/admin/Sidebar";
import { AdminTopbar } from "@/components/admin/Topbar";
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
import StudentEdit from "./StudentEdit";
import Profile from "./Profile";
import EnvironmentBanner from "@/components/EnvironmentBanner";
import { SidebarLayoutProvider } from "@/context/SidebarLayoutContext";
import { PageHeaderProvider } from "@/context/PageHeaderContext";
import Exams from "./Exams";
import CreateExam from "./CreateExam";
import ExamAttempts from "./ExamAttempts";
import CompletedExams from "./CompletedExams";
import CompletedExamDetail from "./CompletedExamDetail";

const Index = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <EnvironmentBanner />
      <SidebarLayoutProvider>
      <PageHeaderProvider>
      <div className="min-h-screen bg-gray-50 flex">
        <AdminSidebar isOpen={isSidebarOpen} onToggle={setIsSidebarOpen} />
      <div className="flex-1 min-w-0 flex flex-col">
      <AdminTopbar onOpenMobileMenu={() => setIsSidebarOpen(true)} />
      {/* overflow-x-clip (no hidden): hidden crea un contenedor de scroll y rompe position: sticky */}
      <main className="flex-1 min-w-0 p-4 lg:p-8 overflow-x-clip">
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
          <Route path="/students/:id/edit" element={<StudentEdit />} />
          <Route path="/exams" element={<Exams />} />
          <Route path="/exams/create" element={<CreateExam />} />
          <Route path="/exams/completed" element={<CompletedExams />} />
          <Route path="/exams/completed/:id" element={<CompletedExamDetail />} />
          <Route path="/exams/:id/intentos" element={<ExamAttempts />} />
          <Route path="/exams/:id/edit" element={<CreateExam />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
      </div>
    </div>
      </PageHeaderProvider>
      </SidebarLayoutProvider>
    </>
  );
};

export default Index;
