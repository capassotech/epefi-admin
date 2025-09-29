
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
  const { login, register, googleRegister, googleLogin, logout } = useAuth();
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

  const validateForm = (googleAuth: boolean = false) => {
    const newErrors: Record<string, string> = {};
    
    if (!googleAuth) {
      if (!formData.email) {
        newErrors.email = "El email es requerido";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "El formato del email es inválido";
      }
  
      if (!formData.password) {
        newErrors.password = "La contraseña es requerida";
      } else {
        const requirements = getPasswordRequirements(formData.password);
        const allRequirementsMet = requirements.minLength && 
                                  requirements.hasUppercase && 
                                  requirements.hasSpecialChar && 
                                  requirements.hasNumber;
        
        if (!allRequirementsMet) {
          newErrors.password = "La contraseña no cumple con todos los requisitos";
        }
      } 
    }

    if (!isLogin) {
      if (!googleAuth) {
        if (!formData.firstName.trim()) {
          newErrors.firstName = "El nombre es requerido";
        } else if (formData.firstName.trim().length < 2) {
          newErrors.firstName = "El nombre debe tener al menos 2 caracteres";
        }
  
        if (!formData.lastName.trim()) {
          newErrors.lastName = "El apellido es requerido";
        } else if (formData.lastName.trim().length < 2) {
          newErrors.lastName = "El apellido debe tener al menos 2 caracteres";
        }
      }

      if (!formData.dni) {
        newErrors.dni = "El DNI es requerido";
      } else if (!/^\d{7,8}$/.test(formData.dni)) {
        newErrors.dni = "El DNI debe tener entre 7 y 8 dígitos";
      }

      if (!formData.acceptTerms) {
        newErrors.acceptTerms = "Debes aceptar los términos y condiciones";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    

    if (!isLogin && !validateForm()) {
      toast.error("Por favor, corrige los errores en el formulario");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);

        const studentData = authService.getStudentDataFromStorage();
        const userName = studentData?.nombre || "Usuario";

        if (studentData?.role === "alumno") {
          toast.success(`No se pudo iniciar sesión, ${userName}`, {
          description: "Debes ingresar con una cuenta de administrador",
            duration: 4000,
          });
          await logout();
          return;
        }

        toast.success(`¡Bienvenido de vuelta, ${userName}!`, {
          description: "Has iniciado sesión exitosamente",
          duration: 4000,
        });

        setTimeout(() => {
          navigate("/");
        }, 1000);
      } else {
        await register(formData);

        const studentData = authService.getStudentDataFromStorage();
        const userName = studentData?.nombre || "Usuario";

        toast.success(`¡Bienvenido a INEE, ${userName}!`, {
          description: "Tu cuenta ha sido creada exitosamente",
          duration: 4000,
        });

        // setTimeout(() => {
        //   navigate("/test-vocacional");
        // }, 1000);
      }
    } catch (error: any) {     
      toast.error(error.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (isLogin) {
      try {
        await googleLogin();

        toast.success("¡Bienvenido de vuelta!", {
          description: "Has iniciado sesión exitosamente",
          duration: 4000,
        });

        setTimeout(() => {
          navigate("/");
        }, 2000);
        return;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Error en el login con Google";
        toast.error(errorMessage);
        return;
      }
    }

    // if (!validateForm(true)) {
    //   toast.error("Por favor, corrige los errores en el formulario");
    //   return;
    // }

    // try {
    //   await googleRegister(formData.firstName, formData.lastName, formData.dni, formData.acceptTerms);

    //   toast.success("¡Bienvenido a INEE!", {
    //     description: "Tu cuenta ha sido creada exitosamente",
    //     duration: 4000,
    //   });

    //   setTimeout(() => {
    //     navigate("/");
    //   }, 2000);
    // } catch (error: unknown) {
    //   const errorMessage = error instanceof Error ? error.message : "Error en el registro con Google";
    //   toast.error(errorMessage);
    // }
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
      onGoogleAuth={handleGoogleAuth}
      onInputChange={handleInputChange}
      onStepChange={handleStepChange}
      onEmailMethodSelect={handleEmailMethodSelect}
      errors={errors}
      formData={formData}
      isSubmitting={isSubmitting}
      showPassword={showPassword}
      setShowPassword={setShowPassword}
      passwordRequirements={getPasswordRequirements(formData.password as string || '')}
    />
  );
};

export default AuthFormController;
