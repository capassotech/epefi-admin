import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCreateUser } from "@/hooks/useCreateUser";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, Mail, IdCard, Loader2, Save, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { DetailLayout, InfoList, InfoRow, ProfileCard, SectionCard } from "@/components/common/DetailLayout";
import { FormField } from "@/components/common/FormField";
import { toast } from "sonner";
import { InteractiveLoader } from "@/components/ui/InteractiveLoader";
import authService from "@/service/authService";
import { usePageHeader } from "@/context/PageHeaderContext";
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
  usePageHeader({ title: "Mi perfil", tourSteps: profileTourSteps });
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

  const busy = isSaving || isLoading;
  const initials = `${formData.nombre[0] ?? ""}${formData.apellido[0] ?? ""}`.toUpperCase();
  const isDirty =
    formData.nombre !== (user.nombre || "") ||
    formData.apellido !== (user.apellido || "") ||
    formData.email !== (user.email || "") ||
    formData.dni !== (user.dni || "");

  const aside = (
    <ProfileCard
      media={
        <span className="grid place-items-center w-11 h-11 shrink-0 rounded-full bg-[#7a1a3a]/10 text-sm font-semibold text-[#7a1a3a]">
          {initials || "?"}
        </span>
      }
      title={`${formData.nombre || "Nombre"} ${formData.apellido || "Apellido"}`}
      subtitle={
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-violet-600" />
          Administrador
        </span>
      }
      footer={
        <>
          <Button
            type="submit"
            form="profile-form"
            size="sm"
            className="h-8 cursor-pointer"
            disabled={busy || !isDirty}
            data-tour="save-button"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
            {busy ? "Guardando…" : "Guardar cambios"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 cursor-pointer"
            onClick={() => setIsPasswordModalOpen(true)}
            data-tour="change-password"
          >
            <Lock className="w-3.5 h-3.5 mr-1.5" />
            Cambiar contraseña
          </Button>
        </>
      }
    >
      <InfoList>
        <InfoRow icon={<Mail />} label="Email">
          <span title={user.email}>{user.email || "—"}</span>
        </InfoRow>
      </InfoList>
      <p className="border-t border-gray-100 px-5 py-3 text-xs text-gray-500">
        {isDirty ? "Tenés cambios sin guardar." : "Modificá tus datos y guardá para aplicar los cambios."}
      </p>
    </ProfileCard>
  );

  return (
    <>
      <DetailLayout aside={aside}>
        <div data-tour="profile-info">
          <SectionCard title="Datos personales" description="Todos los campos son obligatorios">
            <form id="profile-form" onSubmit={handleSubmit} className="grid gap-4 px-5 py-5 sm:grid-cols-2">
              <FormField id="nombre" label="Nombre" icon={<User />} error={errors.nombre}>
                <Input
                  id="nombre"
                  placeholder="Tu nombre"
                  value={formData.nombre}
                  onChange={(e) => handleInputChange("nombre", e.target.value)}
                  className={errors.nombre ? "border-red-500" : ""}
                  disabled={busy}
                />
              </FormField>
              <FormField id="apellido" label="Apellido" icon={<User />} error={errors.apellido}>
                <Input
                  id="apellido"
                  placeholder="Tu apellido"
                  value={formData.apellido}
                  onChange={(e) => handleInputChange("apellido", e.target.value)}
                  className={errors.apellido ? "border-red-500" : ""}
                  disabled={busy}
                />
              </FormField>
              <FormField id="email" label="Email" icon={<Mail />} error={errors.email} className="sm:col-span-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={errors.email ? "border-red-500" : ""}
                  disabled={busy}
                />
              </FormField>
              <FormField id="dni" label="DNI" icon={<IdCard />} error={errors.dni}>
                <Input
                  id="dni"
                  inputMode="numeric"
                  placeholder="12345678"
                  value={formData.dni}
                  onChange={(e) => handleInputChange("dni", formatDNI(e.target.value))}
                  maxLength={8}
                  className={errors.dni ? "border-red-500" : ""}
                  disabled={busy}
                />
              </FormField>
            </form>
          </SectionCard>
        </div>
      </DetailLayout>

      {/* Modal de Cambio de Contraseña */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto overflow-x-hidden">
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
    </>
  );
}
