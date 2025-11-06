import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { BookOpen, Users, Calendar, Plus, User, LogOut, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: BookOpen,
  },
  {
    name: "Estudiantes",
    href: "/students",
    icon: Users,
  },
  {
    name: "Cursos",
    href: "/products",
    icon: Calendar,
  },
  {
    name: "Materias",
    href: "/subjects",
    icon: BookOpen,
  },
  {
    name: "Crear formación",
    href: "/products/create",
    icon: Plus,
  },
];

interface AdminSidebarProps {
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
}

export function AdminSidebar({ isOpen: externalIsOpen, onToggle }: AdminSidebarProps = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const { user, logout } = useAuth();

  // Usar el estado externo si está disponible, sino usar el interno
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = onToggle || setInternalIsOpen;

  // En móviles, el sidebar siempre debe estar cerrado por defecto
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [isMobile]);

  // Cerrar sidebar en móviles cuando cambia la ruta
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [location.pathname, isMobile]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const userFullName = user ? `${user.nombre} ${user.apellido}` : "Cargando...";
  const userEmail = user?.email || "";

  return (
    <>
      {/* Overlay para móviles */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300",
          // Desktop
          !isMobile && "sticky top-0",
          !isMobile && (isCollapsed ? "w-16" : "w-64"),
          // Mobile
          isMobile && "fixed top-0 left-0 z-50 w-64",
          isMobile && (isOpen ? "translate-x-0" : "-translate-x-full")
        )}
      >
      {/* Header */}
      <div className={cn(
        "flex items-center h-16 border-b border-gray-200",
        isMobile ? "px-4 justify-between" : (isCollapsed ? "justify-center px-2" : "px-4")
      )}>
        <Link to="/" className="flex items-center">
          {isMobile ? (
            <div className="w-24 rounded-lg flex items-center justify-center">
              <img src="/logoNegro.png" alt="EPEFI Logo" className="w-24" />
            </div>
          ) : isCollapsed ? (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              <img src="/logoNegro.png" alt="EPEFI Logo" className="w-8 h-8 object-contain" />
            </div>
          ) : (
            <div className="w-24 rounded-lg flex items-center justify-center">
              <img src="/logoNegro.png" alt="EPEFI Logo" className="w-24" />
            </div>
          )}
        </Link>
        
        {/* Botón de cerrar en móviles */}
        {isMobile && (
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 py-6 space-y-2", isMobile ? "px-4" : "px-2")}>
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const navItem = (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center text-sm font-medium rounded-lg transition-colors duration-200",
                isMobile 
                  ? "px-3 py-3" 
                  : isCollapsed 
                    ? "justify-center px-2 py-3 mx-2" 
                    : "px-3 py-2",
                isActive
                  ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon
                className={cn(
                  "flex-shrink-0",
                  isMobile 
                    ? "w-5 h-5 mr-3" 
                    : isCollapsed 
                      ? "w-6 h-6" 
                      : "w-5 h-5 mr-3"
                )}
              />
              {(isMobile || !isCollapsed) && item.name}
            </Link>
          );

          if (!isMobile && isCollapsed) {
            return (
              <TooltipProvider key={item.name}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {navItem}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="ml-2">
                    <p>{item.name}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }

          return navItem;
        })}
      </nav>

      {/* User Section */}
      <div className={cn(
        "border-t border-gray-200 space-y-2",
        isMobile ? "p-4" : (isCollapsed ? "p-2" : "p-4")
      )}>
        <div className={cn(
          "flex items-center",
          isMobile ? "space-x-3" : (isCollapsed ? "justify-center" : "space-x-3")
        )}>
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          {(isMobile || !isCollapsed) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {userFullName}
              </p>
              <p className="text-xs text-gray-500 truncate">{userEmail}</p>
            </div>
          )}
        </div>

        {isMobile ? (
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors duration-200"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Cerrar Sesión
          </button>
        ) : isCollapsed ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center px-2 py-2 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors duration-200"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="ml-2">
                <p>Cerrar Sesión</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors duration-200"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Cerrar Sesión
          </button>
        )}
      </div>

      {/* Collapse Toggle - Solo en desktop */}
      {!isMobile && (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
        >
          <div
            className={cn(
              "w-2 h-2 bg-gray-400 rounded-full transition-transform",
              isCollapsed && "rotate-180"
            )}
          />
        </button>
      )}
      </div>
    </>
  );
}
