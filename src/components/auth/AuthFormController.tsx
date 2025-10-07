import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import authService from "@/service/authService";
import AuthFormView from "./AuthFormView";

interface AuthFormProps {
  isLogin?: boolean;
}

const AuthFormController: React.FC<AuthFormProps> = ({ isLogin = false }) => {
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    dni: "",
    acceptTerms: false,
  });

  const getPasswordRequirements = (password: string) => {
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
      hasNumber: /[0-9]/.test(password),
    };
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "El email es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "El formato del email es inválido";
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es requerida";
    } else if (!isLogin) {
      const requirements = getPasswordRequirements(formData.password);
      const allRequirementsMet =
        requirements.minLength &&
        requirements.hasUppercase &&
        requirements.hasSpecialChar &&
        requirements.hasNumber;

      if (!allRequirementsMet) {
        newErrors.password = "La contraseña no cumple con todos los requisitos";
      }
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
      await login(formData.email, formData.password);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const studentData = authService.getStudentDataFromStorage();
      console.log("📦 Datos del usuario:", studentData);

      const userName = studentData?.nombre || "Usuario";

      const isAdmin = studentData?.role?.admin === true;

      if (!isAdmin) {
        toast.error("Acceso denegado", {
          description: "Debes ingresar con una cuenta de administrador",
          duration: 4000,
        });
        await logout();
        setIsSubmitting(false);
        return;
      }

      toast.success(`¡Bienvenido de vuelta, ${userName}!`, {
        description: "Has iniciado sesión exitosamente",
        duration: 4000,
      });

      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error: any) {
      console.error("❌ Error en login:", error);
      toast.error(error.error || error.message || "Error al iniciar sesión");
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
    setErrors({});
    if (step !== 2) {
      setShowEmailForm(false);
    }
  };

  const handleEmailMethodSelect = () => {
    setShowEmailForm(true);
  };

  return (
    <AuthFormView
      isLogin={isLogin}
      currentStep={currentStep}
      showEmailForm={showEmailForm}
      onSubmit={handleSubmit}
      onGoogleAuth={() => {}} 
      onInputChange={handleInputChange}
      onStepChange={handleStepChange}
      onEmailMethodSelect={handleEmailMethodSelect}
      errors={errors}
      formData={formData}
      isSubmitting={isSubmitting}
      showPassword={showPassword}
      setShowPassword={setShowPassword}
      passwordRequirements={getPasswordRequirements(
        (formData.password as string) || ""
      )}
    />
  );
};

export default AuthFormController;
