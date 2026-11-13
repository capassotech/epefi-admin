import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { BookOpen, Users, Calendar, X, ClipboardCheck, PanelLeftOpen, PanelLeftClose, Moon, Sun, VideoOff } from "lucide-react";
import { useSidebarLayout } from "@/context/SidebarLayoutContext";
import { useTheme } from "@/context/ThemeContext";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";

const navigation = [
  {
    name: "Panel general",
    href: "/",
    icon: BookOpen,
  },
  {
    name: "Usuarios",
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
    name: "Examenes",
    href: "/exams",
    icon: ClipboardCheck,
  },
  {
    name: "Errores de video",
    href: "/video-errors",
    icon: VideoOff,
  },
];

const COLLAPSED_WIDTH = 64;

interface AdminSidebarProps {
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
}

export function AdminSidebar({ isOpen: externalIsOpen, onToggle }: AdminSidebarProps = {}) {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const { setSidebarWidth } = useSidebarLayout();
  const { theme, toggleTheme } = useTheme();
  const panelRef = useRef<HTMLElement>(null);

  // Usar el estado externo si está disponible, sino usar el interno
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = onToggle || setInternalIsOpen;

  const isExpanded = isMobile || !isCollapsed;

  // En móviles, el sidebar siempre debe estar cerrado por defecto
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [isMobile]);

  // Al navegar: cerrar el drawer en móviles y colapsar en desktop
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    } else {
      setIsCollapsed(true);
    }
  }, [location.pathname, isMobile]);

  // En desktop el sidebar expandido flota sobre el contenido,
  // así que el espacio reservado es siempre el del modo colapsado
  useEffect(() => {
    setSidebarWidth(isMobile ? 0 : COLLAPSED_WIDTH);
  }, [isMobile, setSidebarWidth]);

  // Colapsar automáticamente al hacer clic fuera del sidebar (desktop)
  useEffect(() => {
    if (isMobile || isCollapsed) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current && !panelRef.current.contains(target)) {
        setIsCollapsed(true);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsCollapsed(true);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobile, isCollapsed]);

  const toggleLabel = isCollapsed ? "Expandir menú" : "Contraer menú";
  const themeLabel = theme === "dark" ? "Tema claro" : "Tema oscuro";
  const ThemeIcon = theme === "dark" ? Sun : Moon;

  const themeButton = (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={themeLabel}
      className={cn(
        "flex items-center text-sm font-medium rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200 cursor-pointer",
        isExpanded ? "w-full gap-3 px-3" : "justify-center h-10 w-10 mx-auto",
        isExpanded && (isMobile ? "min-h-12" : "py-2")
      )}
    >
      <ThemeIcon className="w-[18px] h-[18px] flex-shrink-0" />
      {isExpanded && <span className="truncate">{themeLabel}</span>}
    </button>
  );

  return (
    <>
      {/* Overlay para móviles */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* En desktop reserva el ancho colapsado; el panel expandido flota encima del contenido */}
      <div
        className={cn(!isMobile && "relative shrink-0 z-40")}
        style={!isMobile ? { width: COLLAPSED_WIDTH } : undefined}
      >
        <aside
          ref={panelRef}
          data-tour="sidebar"
          className={cn(
            "flex flex-col h-dvh bg-white border-r border-gray-200/80 transition-[width,transform,box-shadow] duration-300 ease-out",
            // Desktop
            !isMobile && "fixed top-0 left-0 z-40",
            !isMobile && (isCollapsed ? "w-16" : "w-64 shadow-xl shadow-gray-900/5"),
            // Mobile
            isMobile && "fixed top-0 left-0 z-50 w-64",
            isMobile && (isOpen ? "translate-x-0" : "-translate-x-full")
          )}
        >
          {/* Header */}
          <div
            className={cn(
              "flex items-center h-14 shrink-0",
              isExpanded ? "justify-between pl-5 pr-3" : "justify-center"
            )}
          >
            {isExpanded && (
              <Link to="/" className="flex items-center opacity-80 hover:opacity-100 transition-opacity">
                <BrandLogo className="h-5 w-auto" />
              </Link>
            )}

            {isMobile ? (
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Cerrar menú"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setIsCollapsed(!isCollapsed)}
                      className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                      aria-label={toggleLabel}
                      aria-expanded={!isCollapsed}
                    >
                      {isCollapsed ? (
                        <PanelLeftOpen className="w-[18px] h-[18px]" />
                      ) : (
                        <PanelLeftClose className="w-[18px] h-[18px]" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="ml-2">
                    <p>{toggleLabel}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Navigation */}
          <nav className={cn("flex-1 py-3 space-y-1 overflow-y-auto", isExpanded ? "px-3" : "px-2")}>
            {navigation.map((item) => {
              const isActive =
                item.href === "/" ? location.pathname === "/" : location.pathname.startsWith(item.href);
              const navItem = (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center text-sm font-medium rounded-lg transition-colors duration-200",
                    isExpanded ? "gap-3 px-3 py-2" : "justify-center h-10 w-10 mx-auto",
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon
                    className={cn("w-[18px] h-[18px] flex-shrink-0", isActive && "text-[#f96015]")}
                  />
                  {isExpanded && <span className="truncate">{item.name}</span>}
                </Link>
              );

              if (!isExpanded) {
                return (
                  <TooltipProvider key={item.name}>
                    <Tooltip>
                      <TooltipTrigger asChild>{navItem}</TooltipTrigger>
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

          {/* Tema claro / oscuro */}
          <div className={cn("shrink-0 py-3 border-t border-gray-100", isExpanded ? "px-3" : "px-2")}>
            {isExpanded ? (
              themeButton
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>{themeButton}</TooltipTrigger>
                  <TooltipContent side="right" className="ml-2">
                    <p>{themeLabel}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
