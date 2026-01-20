import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import CreateFirstAdmin from "./pages/CreateFirstAdmin";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { isDevelopmentOrQA } from "@/utils/environment";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/recuperar-contrasena" element={<ForgotPassword />} />
              <Route 
                path="/crear-primer-admin" 
                element={
                  isDevelopmentOrQA() ? (
                    <CreateFirstAdmin />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                } 
              />

              {/* Todas las rutas del admin protegidas */}
              <Route element={<ProtectedRoute />}>
                <Route path="/*" element={<Index />} />
              </Route>
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
