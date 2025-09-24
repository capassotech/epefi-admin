
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Mail, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AuthFormController from '@/components/auth/AuthFormController';

const Login = () => {
  return <AuthFormController isLogin={true} />;
  // const [email, setEmail] = useState('');
  // const [password, setPassword] = useState('');
  // const [isLoading, setIsLoading] = useState(false);
  // const navigate = useNavigate();

  // const handleLogin = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setIsLoading(true);

  //   // Simular autenticación
  //   setTimeout(() => {
  //     setIsLoading(false);
  //     // Redirigir al dashboard después del login
  //     navigate('/');
  //   }, 1000);
  // };

  // return (
  //   <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
  //     <Card className="w-full max-w-md shadow-xl">
  //       <CardHeader className="text-center space-y-2">
  //         <div className="flex justify-center mb-4">
  //           {/* Logo */}
  //           <Link to="/" className="flex items-center space-x-2">
  //             <div className="w-10 h-10 rounded-lg flex items-center justify-center">
  //               <img src="/logo.png" alt="INEE Logo" className="w-10 h-10" />
  //             </div>
  //             <span className="text-xl font-bold text-gray-900">INEE</span>
  //           </Link>
  //         </div>
  //         <CardTitle className="text-2xl font-bold text-gray-900">Panel de administración</CardTitle>
  //         <CardDescription className="text-gray-600">
  //           Gestioná el contenido de tu plataforma educativa
  //         </CardDescription>
  //       </CardHeader>
  //       <CardContent>
  //         <form onSubmit={handleLogin} className="space-y-4">
  //           <div className="space-y-2">
  //             <Label htmlFor="email" className="text-sm font-medium text-gray-700">
  //               Correo electrónico
  //             </Label>
  //             <div className="relative">
  //               <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
  //               <Input
  //                 id="email"
  //                 type="email"
  //                 placeholder="admin@inee.com"
  //                 value={email}
  //                 onChange={(e) => setEmail(e.target.value)}
  //                 className="pl-10"
  //                 required
  //               />
  //             </div>
  //           </div>

  //           <div className="space-y-2">
  //             <Label htmlFor="password" className="text-sm font-medium text-gray-700">
  //               Contraseña
  //             </Label>
  //             <div className="relative">
  //               <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
  //               <Input
  //                 id="password"
  //                 type="password"
  //                 placeholder="••••••••"
  //                 value={password}
  //                 onChange={(e) => setPassword(e.target.value)}
  //                 className="pl-10"
  //                 required
  //               />
  //             </div>
  //           </div>

  //           <Button
  //             type="submit"
  //             className="w-full bg-blue-600 hover:bg-blue-700"
  //             disabled={isLoading}
  //           >
  //             {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
  //           </Button>
  //         </form>
  //       </CardContent>
  //     </Card>
  //   </div>
  // );
};

export default Login;
