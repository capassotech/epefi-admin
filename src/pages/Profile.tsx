import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCreateUser } from "@/hooks/useCreateUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, Mail, IdCard, Loader2, Save, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { InteractiveLoader } from "@/components/ui/InteractiveLoader";
import authService from "@/service/authService";
import { TourButton } from "@/components/tour/TourButton";
import { profileTourSteps } from "@/config/tourSteps";
import { extractErrorMessage } from "@/utils/errorMessages";
import { PasswordRequirements } from "@/components/auth/PasswordRequirements";
import {
  getPasswordRequirementStatus,
  isPasswordPolicySatisfied,
  PASSWORD_REQUIRED_MESSAGE,
  validatePassword,
} from "@/utils/passwordValidation";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { updateUser, isLoading } = useCreateUser();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    dni: "",
  });
  
  // Estado para el modal de cambio de contraseña
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre || "",
        apellido: user.apellido || "",
        email: user.email || "",
        dni: user.dni || "",
      });
      setLoading(false);
    }
  }, [user]);

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

    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "El formato del email es inválido";
    }

    if (!formData.dni.trim()) {
      newErrors.dni = "El DNI es requerido";
    } else if (!/^\d{7,8}$/.test(formData.dni)) {
      newErrors.dni = "El DNI debe tener entre 7 y 8 dígitos";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Por favor, corrige los errores en el formulario");
      return;
    }

    if (!user?.uid) {
      toast.error("No se pudo identificar al usuario");
      return;
    }

    setIsSaving(true);

    try {
      const updateData = {
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        email: formData.email.trim(),
        dni: formData.dni.trim(),
      };

      const result = await updateUser(user.uid, updateData);

      if (result.success) {
        toast.success("Perfil actualizado exitosamente", {
          description: "Tus datos han sido actualizados correctamente",
        });
        
        // Actualizar localStorage con los nuevos datos
        const updatedStudentData = {
          ...user,
          nombre: formData.nombre.trim(),
          apellido: formData.apellido.trim(),
          email: formData.email.trim(),
          dni: formData.dni.trim(),
        };
        
        localStorage.setItem("studentData", JSON.stringify(updatedStudentData));
        
        // Refrescar el contexto
        await refreshUser();
      }
    } catch (error: any) {
      console.error("Error al actualizar perfil:", error);
      const errorMessage = extractErrorMessage(error);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <InteractiveLoader
        initialMessage="Cargando perfil"
        delayedMessage="Conectándose con el servidor, esto puede tomar unos minutos"
      />
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No se pudo cargar la información del usuario</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Mi perfil</h1>
        <TourButton steps={profileTourSteps} />
      </div>

      {/* Información del Perfil */}
      <Card data-tour="profile-info">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Información Personal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre y Apellido */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Nombre <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nombre"
                  type="text"
                  placeholder="Tu nombre"
                  value={formData.nombre}
                  onChange={(e) => handleInputChange("nombre", e.target.value)}
                  className={errors.nombre ? "border-red-500" : ""}
                  disabled={isSaving || isLoading}
                />
                {errors.nombre && (
                  <p className="text-sm text-red-500">{errors.nombre}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="apellido" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Apellido <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="apellido"
                  type="text"
                  placeholder="Tu apellido"
                  value={formData.apellido}
                  onChange={(e) => handleInputChange("apellido", e.target.value)}
                  className={errors.apellido ? "border-red-500" : ""}
                  disabled={isSaving || isLoading}
                />
                {errors.apellido && (
                  <p className="text-sm text-red-500">{errors.apellido}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={errors.email ? "border-red-500" : ""}
                disabled={isSaving || isLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* DNI */}
            <div className="space-y-2">
              <Label htmlFor="dni" className="flex items-center gap-2">
                <IdCard className="w-4 h-4" />
                DNI <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dni"
                type="text"
                placeholder="12345678"
                value={formData.dni}
                onChange={(e) => {
                  const formatted = formatDNI(e.target.value);
                  handleInputChange("dni", formatted);
                }}
                maxLength={8}
                className={errors.dni ? "border-red-500" : ""}
                disabled={isSaving || isLoading}
              />
              {errors.dni && (
                <p className="text-sm text-red-500">{errors.dni}</p>
              )}
            </div>

            {/* Botones */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPasswordModalOpen(true)}
                className="flex items-center gap-2"
                data-tour="change-password"
              >
                <Lock className="w-4 h-4" />
                Cambiar Contraseña
              </Button>
              <Button
                type="submit"
                disabled={isSaving || isLoading}
                className="min-w-[120px]"
                data-tour="save-button"
              >
                {isSaving || isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Modal de Cambio de Contraseña */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Cambiar Contraseña
            </DialogTitle>
            <DialogDescription>
              Ingresa tu contraseña actual y la nueva contraseña
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault();

              const newErrors: Record<string, string> = {};

              if (!passwordData.currentPassword) {
                newErrors.currentPassword = "La contraseña actual es requerida";
              }

              if (!passwordData.newPassword.trim()) {
                newErrors.newPassword = PASSWORD_REQUIRED_MESSAGE;
              } else {
                const { isValid, ruleViolationMessages } = validatePassword(
                  passwordData.newPassword
                );
                if (!isValid) {
                  newErrors.newPassword = ruleViolationMessages.join("\n");
                }
              }

              if (!passwordData.confirmPassword) {
                newErrors.confirmPassword = "Confirma tu nueva contraseña";
              } else if (passwordData.newPassword !== passwordData.confirmPassword) {
                newErrors.confirmPassword = "Las contraseñas no coinciden";
              }

              if (passwordData.currentPassword === passwordData.newPassword) {
                newErrors.newPassword = "La nueva contraseña debe ser diferente a la actual";
              }

              setPasswordErrors(newErrors);

              if (Object.keys(newErrors).length > 0) {
                toast.error("Por favor, corrige los errores en el formulario");
                return;
              }

              setIsChangingPassword(true);

              try {
                await authService.updateUserPassword(
                  passwordData.currentPassword,
                  passwordData.newPassword
                );

                toast.success("Contraseña actualizada exitosamente", {
                  description: "Tu contraseña ha sido cambiada correctamente",
                });

                setIsPasswordModalOpen(false);
                setPasswordData({
                  currentPassword: "",
                  newPassword: "",
                  confirmPassword: "",
                });
                setPasswordErrors({});
              } catch (error: any) {
                console.error("Error al cambiar contraseña:", error);
                const errorMessage = extractErrorMessage(error);
                toast.error(errorMessage);
                if (errorMessage.includes("incorrecta")) {
                  setPasswordErrors({ currentPassword: errorMessage });
                }
              } finally {
                setIsChangingPassword(false);
              }
            }}
            className="space-y-4"
          >
            {/* Contraseña Actual */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Contraseña Actual *</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  placeholder="Tu contraseña actual"
                  value={passwordData.currentPassword}
                  onChange={(e) => {
                    setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }));
                    if (passwordErrors.currentPassword) {
                      setPasswordErrors((prev) => ({ ...prev, currentPassword: "" }));
                    }
                  }}
                  className={passwordErrors.currentPassword ? "border-red-500 pr-10" : "pr-10"}
                  disabled={isChangingPassword}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPasswords((prev) => ({ ...prev, current: !prev.current }))}
                >
                  {showPasswords.current ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {passwordErrors.currentPassword && (
                <p className="text-sm text-red-500">{passwordErrors.currentPassword}</p>
              )}
            </div>

            {/* Nueva Contraseña */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña *</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  placeholder="Tu nueva contraseña"
                  value={passwordData.newPassword}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPasswordData((prev) => ({ ...prev, newPassword: v }));
                    if (!v.trim()) {
                      setPasswordErrors((prev) => ({ ...prev, newPassword: "" }));
                    } else {
                      const { isValid, ruleViolationMessages } = validatePassword(v);
                      setPasswordErrors((prev) => ({
                        ...prev,
                        newPassword: isValid ? "" : ruleViolationMessages.join("\n"),
                      }));
                    }
                  }}
                  className={passwordErrors.newPassword ? "border-red-500 pr-10" : "pr-10"}
                  disabled={isChangingPassword}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPasswords((prev) => ({ ...prev, new: !prev.new }))}
                >
                  {showPasswords.new ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {passwordErrors.newPassword && (
                <ul className="text-sm text-red-500 list-disc pl-4 space-y-0.5">
                  {passwordErrors.newPassword.split("\n").map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}

              <PasswordRequirements
                passwordRequirements={getPasswordRequirementStatus(
                  passwordData.newPassword
                )}
              />
            </div>

            {/* Confirmar Contraseña */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  placeholder="Confirma tu nueva contraseña"
                  value={passwordData.confirmPassword}
                  onChange={(e) => {
                    setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }));
                    if (passwordErrors.confirmPassword) {
                      setPasswordErrors((prev) => ({ ...prev, confirmPassword: "" }));
                    }
                  }}
                  className={passwordErrors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
                  disabled={isChangingPassword}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))}
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {passwordErrors.confirmPassword && (
                <p className="text-sm text-red-500">{passwordErrors.confirmPassword}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                  setPasswordErrors({});
                }}
                disabled={isChangingPassword}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  isChangingPassword ||
                  !passwordData.currentPassword.trim() ||
                  !isPasswordPolicySatisfied(passwordData.newPassword) ||
                  !passwordData.confirmPassword.trim() ||
                  passwordData.newPassword !== passwordData.confirmPassword ||
                  passwordData.currentPassword === passwordData.newPassword
                }
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cambiando...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Cambiar Contraseña
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
