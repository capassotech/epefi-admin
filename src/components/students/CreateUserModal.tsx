import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useCreateUser } from "@/hooks/useCreateUser";

import {
  Loader2,
  User,
  Mail,
  Lock,
  BadgeIcon as IdCard,
  Eye,
  EyeOff,
  Edit2,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type CreateUserFormData, type StudentDB, type FirestoreTimestamp } from "@/types/types";


interface CreateUserModalProps {
  onUserCreated?: () => void;
  triggerText?: string;
  isEditing?: boolean;
  editingUser?: StudentDB;
}

export const CreateUserModal = ({
  onUserCreated,
  triggerText = "Crear Estudiante",
  isEditing = false,
  editingUser,
}: CreateUserModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmEmail, setConfirmEmail] = useState("");
  const [formData, setFormData] = useState<CreateUserFormData & { id?: string; fechaRegistro?: FirestoreTimestamp }>({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    dni: "",
    role: {
      admin: false,
      student: false,
    },
    cursos_asignados: [],
    emailVerificado: false,
    id: undefined,
    fechaRegistro: undefined,
  });
  const { createUser, updateUser, isLoading } = useCreateUser();

  // Resetear formulario cuando el modal se cierra
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        nombre: "",
        apellido: "",
        email: "",
        password: "",
        dni: "",
        role: {
          admin: false,
          student: false,
        },
        cursos_asignados: [],
        emailVerificado: false,
        id: undefined,
        fechaRegistro: undefined,
      });
      setConfirmEmail("");
      setErrors({});
    }
  }, [isOpen]);

  // Cargar datos del usuario cuando se abre el modal para editar
  useEffect(() => {
    if (isOpen && isEditing && editingUser) {
      setFormData({
        nombre: editingUser.nombre,
        apellido: editingUser.apellido,
        email: editingUser.email,
        password: "",
        dni: editingUser.dni,
        role: editingUser.role,
        cursos_asignados: editingUser.cursos_asignados,
        emailVerificado: editingUser.emailVerificado,
        id: editingUser.id,
        fechaRegistro: editingUser.fechaRegistro,
      });
      setConfirmEmail(editingUser.email); 
    }
  }, [isOpen, isEditing, editingUser]);


  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    }

    if (!formData.apellido.trim()) {
      newErrors.apellido = "El apellido es requerido";
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "El email no es válido";
    }

    if (!formData.dni.trim()) {
      newErrors.dni = "El DNI es requerido";
    } else if (!/^\d{7,8}$/.test(formData.dni.replace(/\D/g, ""))) {
      newErrors.dni = "El DNI debe tener 7 u 8 dígitos";
    }

    if (!formData.role || (!formData.role.admin && !formData.role.student)) {
      newErrors.role = "El rol es requerido";
    }

    // Solo validar contraseña si estamos creando un nuevo usuario
    if (!isEditing && !formData.password.trim()) {
      newErrors.password = "La contraseña es requerida";
    }

    // Solo validar confirmación de email si estamos creando un nuevo usuario
    if (!isEditing && confirmEmail !== formData.email) {
      newErrors.emailVerificado = "El email de confirmación no coincide con el email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!isEditing) {
      if (confirmEmail === formData.email) {
        setFormData((prev) => ({ ...prev, emailVerificado: true }));
      } else {
        setErrors({
          emailVerificado: "El email de confirmación no coincide con el email",
        });
        setFormData((prev) => ({ ...prev, emailVerificado: false }));
        return;
      }
    }

    let result;
    
    if (isEditing) {
      const updateData = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        dni: formData.dni,
        role: formData.role,
        cursos_asignados: formData.cursos_asignados,
        emailVerificado: formData.emailVerificado,
      };

      console.log(updateData);
      result = await updateUser(formData.id!, updateData);
    } else {
      result = await createUser(formData);
    }

    if (result.success) {
      setIsOpen(false);
      if (onUserCreated) onUserCreated();
    }
  };

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    if (field === "role") {
      const selected = String(value);
      setFormData((prev) => ({
        ...prev,
        role: {
          admin: selected === "admin",
          student: selected === "student",
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const formatDNI = (value: string) => {
    // Remover caracteres no numéricos y limitar a 8 dígitos
    const numbers = value.replace(/\D/g, "").slice(0, 8);
    return numbers;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {isEditing ? (
          <button
            className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
            title="Editar estudiante"
          >
            <Edit2 className="w-4 h-4 cursor-pointer" />
          </button>
        ) : (
          <Button className="cursor-pointer">
            <User className="w-4 h-4 mr-2" />
            {triggerText}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>{isEditing ? "Editar Usuario" : "Crear Nuevo Usuario"}</span>
          </DialogTitle>
        </DialogHeader>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nombre y Apellido en una fila */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre */}
                <div className="space-y-2">
                  <Label
                    htmlFor="nombre"
                    className="flex items-center space-x-2"
                  >
                    <User className="w-4 h-4" />
                    <span>Nombre <span className="text-red-500">*</span></span>
                  </Label>
                  <Input
                    id="nombre"
                    type="text"
                    placeholder="Nombre"
                    value={formData.nombre}
                    onChange={(e) =>
                      handleInputChange("nombre", e.target.value)
                    }
                    className={errors.nombre ? "border-red-500" : ""}
                    disabled={isLoading}
                  />
                  {errors.nombre && (
                    <p className="text-sm text-red-500">{errors.nombre}</p>
                  )}
                </div>

                {/* Apellido */}
                <div className="space-y-2">
                  <Label
                    htmlFor="apellido"
                    className="flex items-center space-x-2"
                  >
                    <User className="w-4 h-4" />
                    <span>Apellido <span className="text-red-500">*</span></span>
                  </Label>
                  <Input
                    id="apellido"
                    type="text"
                    placeholder="Apellido"
                    value={formData.apellido}
                    onChange={(e) =>
                      handleInputChange("apellido", e.target.value)
                    }
                    className={errors.apellido ? "border-red-500" : ""}
                    disabled={isLoading}
                  />
                  {errors.apellido && (
                    <p className="text-sm text-red-500">{errors.apellido}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Email <span className="text-red-500">*</span></span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={errors.email ? "border-red-500" : ""}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              {/* Verificacion de Email - Solo mostrar si estamos creando un nuevo usuario */}
              {!isEditing && (
                <div className="space-y-2">
                  <Label htmlFor="confirmEmail" className="flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>Confirmar Email <span className="text-red-500">*</span></span>
                  </Label>
                  <Input
                    id="confirmEmail"
                    type="email"
                    placeholder="usuario@ejemplo.com"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    className={errors.emailVerificado ? "border-red-500" : ""}
                    disabled={isLoading}
                  />
                  {errors.emailVerificado && (
                    <p className="text-sm text-red-500">{errors.emailVerificado}</p>
                  )}
                </div>
              )}

              {/* Password - Solo mostrar si estamos creando un nuevo usuario */}
              {!isEditing && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center space-x-2">
                    <Lock className="w-4 h-4" />
                    <span>Contraseña <span className="text-red-500">*</span></span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Tu contraseña"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className={errors.password ? "border-red-500" : ""}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors duration-200"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 cursor-pointer" />
                      ) : (
                        <Eye className="h-4 w-4 cursor-pointer" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password}</p>
                  )}
                </div>
              )}

              {/* DNI */}
              <div className="space-y-2">
                <Label htmlFor="dni" className="flex items-center space-x-2">
                  <IdCard className="w-4 h-4" />
                  <span>DNI <span className="text-red-500">*</span></span>
                </Label>
                <Input
                  id="dni"
                  type="text"
                  placeholder="12345678"
                  value={formData.dni}
                  onChange={(e) =>
                    handleInputChange("dni", formatDNI(e.target.value))
                  }
                  className={errors.dni ? "border-red-500" : ""}
                  disabled={isLoading}
                  maxLength={8}
                />
                {errors.dni && (
                  <p className="text-sm text-red-500">{errors.dni}</p>
                )}
              </div>

              {/* Rol */}
              <div className="space-y-2">
                <Label
                  htmlFor="role"
                  className="flex items-center space-x-2"
                >
                  <User className="w-4 h-4" />
                  <span>Rol <span className="text-red-500">*</span></span>
                </Label>
                <div className="relative">
                  <Select
                    value={formData.role.admin ? "admin" : formData.role.student ? "student" : ""}
                    onValueChange={(value) => handleInputChange("role", value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="role" className={errors.role ? "w-full border-red-500" : "w-full"}>
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="student">Estudiante</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {errors.role && (
                  <p className="text-sm text-red-500">{errors.role}</p>
                )}
              </div>

              {/* Botones */}
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                  className="flex-1 cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1 cursor-pointer">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isEditing ? "Actualizando..." : "Creando..."}
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4 mr-2" />
                      {isEditing ? "Actualizar Usuario" : "Crear Usuario"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};
