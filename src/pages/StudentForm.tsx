// src/pages/StudentForm.tsx — alta (/students/new) y edición (/students/:id/edit) de usuarios
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Eye,
  EyeOff,
  GraduationCap,
  IdCard,
  Loader2,
  Lock,
  Mail,
  Save,
  ShieldCheck,
  User,
  UserPlus,
} from "lucide-react";
import { usePageHeader } from "@/context/PageHeaderContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InteractiveLoader } from "@/components/ui/InteractiveLoader";
import { DetailLayout, ProfileCard, SectionCard, StatusPill } from "@/components/common/DetailLayout";
import { FormField } from "@/components/common/FormField";
import { PasswordRequirements } from "@/components/auth/PasswordRequirements";
import { useCreateUser } from "@/hooks/useCreateUser";
import { StudentsAPI } from "@/service/students";
import type { StudentDB } from "@/types/types";
import {
  getPasswordRequirementStatus,
  isPasswordPolicySatisfied,
  PASSWORD_REQUIRED_MESSAGE,
  validatePassword,
} from "@/utils/passwordValidation";

type FormState = {
  nombre: string;
  apellido: string;
  email: string;
  confirmEmail: string;
  password: string;
  dni: string;
  role: "admin" | "student" | "";
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const EMPTY_FORM: FormState = {
  nombre: "",
  apellido: "",
  email: "",
  confirmEmail: "",
  password: "",
  dni: "",
  role: "student",
};

const toForm = (student: StudentDB): FormState => ({
  nombre: student.nombre ?? "",
  apellido: student.apellido ?? "",
  email: student.email ?? "",
  confirmEmail: student.email ?? "",
  password: "",
  dni: student.dni ?? "",
  role: student.role?.admin ? "admin" : student.role?.student ? "student" : "",
});

// Solo números, hasta 8 dígitos
const formatDNI = (value: string) => value.replace(/\D/g, "").slice(0, 8);

export default function StudentForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { createUser, updateUser, isLoading: saving } = useCreateUser();
  const [student, setStudent] = useState<StudentDB | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [loadError, setLoadError] = useState<string | null>(null);

  const detailPath = id ? `/students/${encodeURIComponent(id)}` : "/students";

  useEffect(() => {
    if (!id) return;
    StudentsAPI.getById(id)
      .then((data: StudentDB) => {
        setStudent(data);
        setForm(toForm(data));
      })
      .catch((err: unknown) => {
        console.error("Error al cargar usuario:", err);
        setLoadError(err instanceof Error ? err.message : "Error al cargar el usuario");
      })
      .finally(() => setLoading(false));
  }, [id]);

  usePageHeader({
    title: isEditing ? "Editar" : "Nuevo usuario",
    breadcrumbs: [
      { label: "Usuarios", to: "/students" },
      ...(isEditing && student ? [{ label: `${student.nombre} ${student.apellido}`, to: detailPath }] : []),
    ],
  });

  const setField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "password" && !isEditing) {
      // La contraseña se valida en vivo para mostrar qué reglas faltan
      const { isValid, ruleViolationMessages } = validatePassword(value);
      setErrors((prev) => ({
        ...prev,
        password: !value.trim() ? PASSWORD_REQUIRED_MESSAGE : isValid ? "" : ruleViolationMessages.join("\n"),
      }));
      return;
    }
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // Mismas reglas que tenía el modal de usuarios
  const validate = () => {
    const next: FormErrors = {};
    if (!form.nombre.trim()) next.nombre = "El nombre es requerido";
    if (!form.apellido.trim()) next.apellido = "El apellido es requerido";
    if (!form.email.trim()) next.email = "El email es requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "El email no es válido";
    if (!form.dni.trim()) next.dni = "El DNI es requerido";
    else if (!/^\d{7,8}$/.test(form.dni.replace(/\D/g, ""))) next.dni = "El DNI debe tener 7 u 8 dígitos";
    if (!form.role) next.role = "El rol es requerido";
    if (!isEditing) {
      if (form.confirmEmail !== form.email) {
        next.confirmEmail = "El email de confirmación no coincide con el email";
      }
      if (!form.password.trim()) {
        next.password = PASSWORD_REQUIRED_MESSAGE;
      } else {
        const { isValid, ruleViolationMessages } = validatePassword(form.password);
        if (!isValid) next.password = ruleViolationMessages.join("\n");
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const role = { admin: form.role === "admin", student: form.role === "student" };
  const isDirty = isEditing
    ? !!student && JSON.stringify(form) !== JSON.stringify(toForm(student))
    : true;
  const canSubmit = !saving && isDirty && (isEditing || isPasswordPolicySatisfied(form.password));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // useCreateUser ya muestra el toast de éxito o error
    if (isEditing && student) {
      const result = await updateUser(student.id, {
        nombre: form.nombre,
        apellido: form.apellido,
        email: form.email,
        dni: form.dni,
        role,
        cursos_asignados: student.cursos_asignados,
        emailVerificado: student.emailVerificado,
      });
      if (result.success) navigate(detailPath);
      return;
    }

    const result = await createUser({
      nombre: form.nombre,
      apellido: form.apellido,
      email: form.email,
      password: form.password,
      dni: form.dni,
      role,
      cursos_asignados: [],
      emailVerificado: true,
      activo: true,
    });
    if (result.success) {
      // Al crear, se abre el detalle para asignarle cursos
      const newId = result.user?.id;
      navigate(newId ? `/students/${encodeURIComponent(newId)}` : "/students");
    } else if (result.emailAlreadyInUse) {
      setErrors((prev) => ({
        ...prev,
        email: result.message?.trim() || "Ya existe otro usuario con este email. Prueba con otro correo.",
      }));
    }
  };

  if (loading) {
    return (
      <InteractiveLoader
        initialMessage="Cargando usuario"
        delayedMessage="Conectándose con el servidor, esto puede tomar unos minutos"
      />
    );
  }
  if (isEditing && (loadError || !student)) {
    return <div className="p-6 text-red-500">❌ {loadError || "No se encontró el usuario"}</div>;
  }

  const isAdmin = form.role === "admin";
  const initials = `${form.nombre[0] ?? ""}${form.apellido[0] ?? ""}`.toUpperCase();

  const aside = (
    <ProfileCard
      media={
        <span
          className={`grid place-items-center w-11 h-11 shrink-0 rounded-full text-sm font-semibold ${
            isAdmin ? "bg-violet-50 text-violet-700" : "bg-gray-100 text-gray-600"
          }`}
        >
          {initials || <UserPlus className="w-5 h-5" />}
        </span>
      }
      title={`${form.nombre || "Nombre"} ${form.apellido || "Apellido"}`}
      subtitle={
        <span className="flex items-center gap-1.5">
          {isAdmin ? (
            <ShieldCheck className="w-3.5 h-3.5 text-violet-600" />
          ) : (
            <GraduationCap className="w-3.5 h-3.5" />
          )}
          {isAdmin ? "Administrador" : "Estudiante"}
        </span>
      }
      badge={isEditing && student ? <StatusPill active={Boolean(student.activo)} /> : undefined}
      footer={
        <>
          <Button type="submit" form="user-form" size="sm" className="h-8 cursor-pointer" disabled={!canSubmit}>
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : isEditing ? (
              <Save className="w-3.5 h-3.5 mr-1.5" />
            ) : (
              <UserPlus className="w-3.5 h-3.5 mr-1.5" />
            )}
            {saving ? (isEditing ? "Guardando…" : "Creando…") : isEditing ? "Guardar cambios" : "Crear usuario"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-gray-500 cursor-pointer"
            onClick={() => navigate(detailPath)}
            disabled={saving}
          >
            Cancelar
          </Button>
        </>
      }
    >
      <p className="px-5 py-3 text-xs text-gray-500">
        {isEditing
          ? isDirty
            ? "Tenés cambios sin guardar."
            : "Modificá los datos y guardá para aplicar los cambios."
          : "Después de crearlo vas a poder asignarle cursos desde su detalle."}
      </p>
    </ProfileCard>
  );

  return (
    <DetailLayout aside={aside}>
      <form id="user-form" onSubmit={handleSubmit} className="space-y-6">
        <SectionCard title="Datos personales" description="Todos los campos son obligatorios">
          <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
            <FormField id="nombre" label="Nombre" icon={<User />} error={errors.nombre}>
              <Input
                id="nombre"
                placeholder="Nombre"
                value={form.nombre}
                onChange={(e) => setField("nombre", e.target.value)}
                className={errors.nombre ? "border-red-500" : ""}
                disabled={saving}
                autoFocus
              />
            </FormField>
            <FormField id="apellido" label="Apellido" icon={<User />} error={errors.apellido}>
              <Input
                id="apellido"
                placeholder="Apellido"
                value={form.apellido}
                onChange={(e) => setField("apellido", e.target.value)}
                className={errors.apellido ? "border-red-500" : ""}
                disabled={saving}
              />
            </FormField>
            <FormField id="dni" label="DNI" icon={<IdCard />} error={errors.dni}>
              <Input
                id="dni"
                inputMode="numeric"
                placeholder="12345678"
                maxLength={8}
                value={form.dni}
                onChange={(e) => setField("dni", formatDNI(e.target.value))}
                className={errors.dni ? "border-red-500" : ""}
                disabled={saving}
              />
            </FormField>
            <FormField id="role" label="Rol" icon={<ShieldCheck />} error={errors.role}>
              <Select value={form.role} onValueChange={(value) => setField("role", value)} disabled={saving}>
                <SelectTrigger id="role" className={`w-full ${errors.role ? "border-red-500" : ""}`}>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Estudiante</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>
        </SectionCard>

        <SectionCard
          title="Acceso"
          description={isEditing ? "Email con el que el usuario inicia sesión" : "Credenciales para iniciar sesión"}
        >
          <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
            <FormField id="email" label="Email" icon={<Mail />} error={errors.email} className={isEditing ? "sm:col-span-2" : ""}>
              <Input
                id="email"
                type="email"
                placeholder="usuario@ejemplo.com"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                className={errors.email ? "border-red-500" : ""}
                disabled={saving}
              />
            </FormField>
            {!isEditing && (
              <>
                <FormField id="confirmEmail" label="Confirmar email" icon={<Mail />} error={errors.confirmEmail}>
                  <Input
                    id="confirmEmail"
                    type="email"
                    placeholder="usuario@ejemplo.com"
                    value={form.confirmEmail}
                    onChange={(e) => setField("confirmEmail", e.target.value)}
                    className={errors.confirmEmail ? "border-red-500" : ""}
                    disabled={saving}
                  />
                </FormField>
                <FormField id="password" label="Contraseña" icon={<Lock />} error={errors.password} className="sm:col-span-2">
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Contraseña inicial"
                      value={form.password}
                      onChange={(e) => setField("password", e.target.value)}
                      className={`pr-10 ${errors.password ? "border-red-500" : ""}`}
                      disabled={saving}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      disabled={saving}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormField>
                <div className="sm:col-span-2">
                  <PasswordRequirements passwordRequirements={getPasswordRequirementStatus(form.password)} />
                </div>
              </>
            )}
          </div>
        </SectionCard>
      </form>
    </DetailLayout>
  );
}
