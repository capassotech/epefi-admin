
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Users,
  Calendar,
  // Search,
  Plus,
  User,
  LogOut
} from 'lucide-react';
// import { useAuth } from '@/context/AuthContext';

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: BookOpen
  },
  {
    name: 'Estudiantes',
    href: '/students',
    icon: Users
  },
  {
    name: 'Formaciones',
    href: '/products',
    icon: Calendar
  },
  {
    name: 'Crear formación',
    href: '/products/create',
    icon: Plus
  }
];

export function AdminSidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  // const { user, logout } = useAuth();
  
  return (
    <div className={cn(
      "flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center h-16 px-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-24 rounded-lg flex items-center justify-center">
              <img src="/logo.png" alt="EPEFI Logo" className="w-24" />
            </div>
          </Link>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200",
                isActive
                  ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className={cn("flex-shrink-0", isCollapsed ? "w-5 h-5" : "w-5 h-5 mr-3")} />
              {!isCollapsed && item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-gray-600" />
          </div>
          {/* {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.nombre} {user?.apellido}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          )} */}
        </div>

        {!isCollapsed && (
          <Link
            to="/login"
            // onClick={() => logout()}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors duration-200"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Cerrar Sesión
          </Link>
        )}
      </div>

      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
      >
        <div className={cn("w-2 h-2 bg-gray-400 rounded-full transition-transform", isCollapsed && "rotate-180")} />
      </button>
    </div>
  );
}
