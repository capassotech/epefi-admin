// src/pages/StudentEdit.tsx
import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GraduationCap, IdCard, Loader2, Mail, Save, ShieldCheck, User } from "lucide-react";
import { usePageHeader } from "@/context/PageHeaderContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InteractiveLoader } from "@/components/ui/InteractiveLoader";
import { DetailLayout, ProfileCard, SectionCard, StatusPill } from "@/components/common/DetailLayout";
import { useCreateUser } from "@/hooks/useCreateUser";
import { StudentsAPI } from "@/service/students";
import type { StudentDB } from "@/types/types";

type FormState = {
  nombre: string;
  apellido: string;
  email: string;
  dni: string;
  role: "admin" | "student" | "";
};

const EMPTY_FORM: FormState = { nombre: "", apellido: "", email: "", dni: "", role: "" };

const toForm = (student: StudentDB): FormState => ({
  nombre: student.nombre ?? "",
  apellido: student.apellido ?? "",
  email: student.email ?? "",
  dni: student.dni ?? "",
  role: student.role?.admin ? "admin" : student.role?.student ? "student" : "",
});

// Solo números, hasta 8 dígitos
const formatDNI = (value: string) => value.replace(/\D/g, "").slice(0, 8);

function Field({
  id,
  label,
  icon,
  error,
  children,
}: {
  id: string;
  label: string;
  icon: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="flex items-center gap-1.5 text-xs font-medium text-gray-600 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:text-gray-400">
        {icon}
        {label}
        <span className="text-red-500">*</span>
      </Label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function StudentEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateUser, isLoading: saving } = useCreateUser();
  const [student, setStudent] = useState<StudentDB | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const detailPath = `/students/${encodeURIComponent(id ?? "")}`;

  useEffect(() => {
    if (!id) {
      setLoadError("ID de usuario no proporcionado");
      setLoading(false);
      return;
    }
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

  const fullName = student ? `${student.nombre} ${student.apellido}` : "";
  usePageHeader({
    title: "Editar",
    breadcrumbs: [
      { label: "Usuarios", to: "/students" },
      ...(student ? [{ label: fullName, to: detailPath }] : []),
    ],
  });

  const setField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // Mismas reglas que el alta de usuarios
  const validate = () => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.nombre.trim()) next.nombre = "El nombre es requerido";
    if (!form.apellido.trim()) next.apellido = "El apellido es requerido";
    if (!form.email.trim()) next.email = "El email es requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "El email no es válido";
    if (!form.dni.trim()) next.dni = "El DNI es requerido";
    else if (!/^\d{7,8}$/.test(form.dni.replace(/\D/g, ""))) next.dni = "El DNI debe tener 7 u 8 dígitos";
    if (!form.role) next.role = "El rol es requerido";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const isDirty = !!student && JSON.stringify(form) !== JSON.stringify(toForm(student));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !validate()) return;

    // useCreateUser ya muestra el toast de éxito o error
    const result = await updateUser(student.id, {
      nombre: form.nombre,
      apellido: form.apellido,
      email: form.email,
      dni: form.dni,
      role: { admin: form.role === "admin", student: form.role === "student" },
      cursos_asignados: student.cursos_asignados,
      emailVerificado: student.emailVerificado,
    });
    if (result.success) navigate(detailPath);
  };

  if (loading) {
    return (
      <InteractiveLoader
        initialMessage="Cargando usuario"
        delayedMessage="Conectándose con el servidor, esto puede tomar unos minutos"
      />
    );
  }
  if (loadError || !student) {
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
          {initials || "?"}
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
      badge={<StatusPill active={Boolean(student.activo)} />}
      footer={
        <>
          <Button type="submit" form="edit-user-form" size="sm" className="h-8 cursor-pointer" disabled={saving || !isDirty}>
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-1.5" />
            )}
            {saving ? "Guardando…" : "Guardar cambios"}
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
        {isDirty ? "Tenés cambios sin guardar." : "Modificá los datos y guardá para aplicar los cambios."}
      </p>
    </ProfileCard>
  );

  return (
    <DetailLayout aside={aside}>
      <SectionCard title="Datos personales" description="Todos los campos son obligatorios">
        <form id="edit-user-form" onSubmit={handleSubmit} className="grid gap-4 px-5 py-5 sm:grid-cols-2">
          <Field id="nombre" label="Nombre" icon={<User />} error={errors.nombre}>
            <Input
              id="nombre"
              value={form.nombre}
              onChange={(e) => setField("nombre", e.target.value)}
              className={errors.nombre ? "border-red-500" : ""}
              disabled={saving}
              autoFocus
            />
          </Field>
          <Field id="apellido" label="Apellido" icon={<User />} error={errors.apellido}>
            <Input
              id="apellido"
              value={form.apellido}
              onChange={(e) => setField("apellido", e.target.value)}
              className={errors.apellido ? "border-red-500" : ""}
              disabled={saving}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field id="email" label="Email" icon={<Mail />} error={errors.email}>
              <Input
                id="email"
                type="email"
                placeholder="usuario@ejemplo.com"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                className={errors.email ? "border-red-500" : ""}
                disabled={saving}
              />
            </Field>
          </div>
          <Field id="dni" label="DNI" icon={<IdCard />} error={errors.dni}>
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
          </Field>
          <Field id="role" label="Rol" icon={<ShieldCheck />} error={errors.role}>
            <Select value={form.role} onValueChange={(value) => setField("role", value)} disabled={saving}>
              <SelectTrigger id="role" className={`w-full ${errors.role ? "border-red-500" : ""}`}>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Estudiante</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </form>
      </SectionCard>
    </DetailLayout>
  );
}
