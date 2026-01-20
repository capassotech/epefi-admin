import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, Eye, EyeOff, Loader2, Shield, User, BadgeIcon as IdCard } from "lucide-react";
import { toast } from "sonner";
import authService from "@/service/authService";
import { extractErrorMessage } from "@/utils/errorMessages";

const CreateFirstAdmin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    confirmPassword: "",
    dni: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    } else if (formData.nombre.trim().length < 2) {
      newErrors.nombre = "El nombre debe tener al menos 2 caracteres";
    }

    if (!formData.apellido.trim()) {
      newErrors.apellido = "El apellido es requerido";
    } else if (formData.apellido.trim().length < 2) {
      newErrors.apellido = "El apellido debe tener al menos 2 caracteres";
    }

    if (!formData.email) {
      newErrors.email = "El email es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "El formato del email es inválido";
    }

    if (!formData.dni) {
      newErrors.dni = "El DNI es requerido";
    } else if (formData.dni.length < 7) {
      newErrors.dni = "El DNI debe tener al menos 7 caracteres";
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es requerida";
    } else if (formData.password.length < 8) {
      newErrors.password = "La contraseña debe tener al menos 8 caracteres";
    } else {
      const hasUppercase = /[A-Z]/.test(formData.password);
      const hasNumber = /[0-9]/.test(formData.password);
      const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(formData.password);

      if (!hasUppercase || !hasNumber || !hasSpecialChar) {
        newErrors.password = "La contraseña debe tener mayúscula, número y carácter especial";
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirma tu contraseña";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!validateForm()) {
      toast.error("Por favor, corrige los errores en el formulario");
      return;
    }

    setIsSubmitting(true);

    try {
      // Usar el endpoint de registro público
      const response = await authService.register({
        email: formData.email,
        password: formData.password,
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        dni: formData.dni.trim(),
        aceptaTerminos: true,
      });

      // Si el registro fue exitoso (incluso si el customToken falló)
      if (response) {
        // Si hay un error con el customToken pero el usuario fue creado
        if ((response as any).customTokenError) {
          toast.success("Administrador creado exitosamente", {
            description: "Por favor, inicia sesión con tu email y contraseña",
            duration: 4000,
          });
        } else {
          toast.success("Administrador creado exitosamente", {
            description: "Redirigiendo al inicio de sesión...",
            duration: 3000,
          });
        }

        // Esperar un momento y redirigir al login
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (error: any) {
      console.error("Error al crear administrador:", error);
      
      // Si el error es específico del customToken, el usuario fue creado en el backend
      if (error.code === "auth/custom-token-mismatch" || 
          error.code === "auth/invalid-custom-token" ||
          error.message?.includes("custom-token")) {
        toast.success("Administrador creado exitosamente", {
          description: "El usuario fue creado. Por favor, inicia sesión con tu email y contraseña",
          duration: 4000,
        });
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        const errorMessage = extractErrorMessage(error);
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const formatDNI = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 8);
    return numbers;
  };

  return (
    <div className="min-h-screen bg-gradient-hero dark:bg-gradient-hero-dark flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 mb-8">
            <div className="flex items-center space-x-2">
              <div className="h-10 rounded-lg flex items-center justify-center">
                <img
                  src="/logoNegro.png"
                  alt="EPEFI Logo"
                  className="h-20"
                />
              </div>
            </div>
          </div>
        </div>

        <Card className="shadow-2xl border-0 card-gradient">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-primary">
                Crear Primer Administrador
              </span>
            </div>
            <CardTitle className="text-2xl font-bold text-center text-foreground">
              Configuración Inicial
            </CardTitle>
            <p className="text-center text-sm text-muted-foreground mt-2">
              Crea la primera cuenta de administrador para comenzar.
              <br />
              <span className="text-xs">
                El primer usuario registrado será automáticamente asignado como administrador.
              </span>
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre" className="form-label">
                    Nombre
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="nombre"
                      type="text"
                      placeholder="Tu nombre"
                      className={`pl-10 form-input ${
                        errors.nombre ? "border-destructive ring-destructive" : ""
                      }`}
                      value={formData.nombre}
                      onChange={(e) => handleInputChange("nombre", e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.nombre && <p className="form-error">{errors.nombre}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apellido" className="form-label">
                    Apellido
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="apellido"
                      type="text"
                      placeholder="Tu apellido"
                      className={`pl-10 form-input ${
                        errors.apellido ? "border-destructive ring-destructive" : ""
                      }`}
                      value={formData.apellido}
                      onChange={(e) => handleInputChange("apellido", e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.apellido && <p className="form-error">{errors.apellido}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dni" className="form-label">
                  DNI
                </Label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dni"
                    type="text"
                    placeholder="Tu número de DNI"
                    className={`pl-10 form-input ${
                      errors.dni ? "border-destructive ring-destructive" : ""
                    }`}
                    value={formData.dni}
                    onChange={(e) => handleInputChange("dni", formatDNI(e.target.value))}
                    disabled={isSubmitting}
                    maxLength={8}
                  />
                </div>
                {errors.dni && <p className="form-error">{errors.dni}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="form-label">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    className={`pl-10 form-input ${
                      errors.email ? "border-destructive ring-destructive" : ""
                    }`}
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.email && <p className="form-error">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="form-label">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Crea una contraseña segura"
                    className={`pl-10 pr-10 form-input ${
                      errors.password ? "border-destructive ring-destructive" : ""
                    }`}
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors duration-200"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 cursor-pointer" />
                    ) : (
                      <Eye className="h-4 w-4 cursor-pointer" />
                    )}
                  </button>
                </div>
                {errors.password && <p className="form-error">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="form-label">
                  Confirmar Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirma tu contraseña"
                    className={`pl-10 pr-10 form-input ${
                      errors.confirmPassword ? "border-destructive ring-destructive" : ""
                    }`}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors duration-200"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isSubmitting}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 cursor-pointer" />
                    ) : (
                      <Eye className="h-4 w-4 cursor-pointer" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && <p className="form-error">{errors.confirmPassword}</p>}
              </div>

              <Button
                type="submit"
                className="w-full btn-gradient dark:btn-gradient-dark hover:opacity-90 transition-all duration-200 font-medium"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando administrador...
                  </>
                ) : (
                  "Crear Administrador"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateFirstAdmin;

