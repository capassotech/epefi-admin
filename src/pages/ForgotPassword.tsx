import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, Eye, EyeOff, Loader2, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import EnvironmentBanner from "@/components/EnvironmentBanner";
import { extractErrorMessage } from "@/utils/errorMessages";

const ForgotPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { forgotPassword, changePassword } = useAuth();
  
  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");
  const isResetMode = mode === "resetPassword" && !!oobCode;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const getPasswordRequirements = (password: string) => {
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
      hasNumber: /[0-9]/.test(password),
    };
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setErrors({ email: "El email es requerido" });
      return;
    }

    if (!validateEmail(email)) {
      setErrors({ email: "El formato del email es inválido" });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await forgotPassword(email);
      setEmailSent(true);
      toast.success("Email enviado", {
        description: "Revisa tu correo para restablecer tu contraseña",
        duration: 4000,
      });
    } catch (error: any) {
      console.error("Error al solicitar recuperación:", error);
      const errorMessage = extractErrorMessage(error);
      toast.error(errorMessage);
      if (error.exists === false) {
        setErrors({ email: "Este email no está registrado" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!password) {
      newErrors.password = "La contraseña es requerida";
    } else {
      const requirements = getPasswordRequirements(password);
      const allRequirementsMet =
        requirements.minLength &&
        requirements.hasUppercase &&
        requirements.hasSpecialChar &&
        requirements.hasNumber;

      if (!allRequirementsMet) {
        newErrors.password = "La contraseña no cumple con todos los requisitos";
      }
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirma tu contraseña";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Por favor, corrige los errores en el formulario");
      return;
    }

    if (!oobCode) {
      toast.error("Código de recuperación inválido");
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await changePassword(oobCode, password);
      toast.success("Contraseña restablecida", {
        description: "Tu contraseña ha sido cambiada exitosamente",
        duration: 4000,
      });
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error: any) {
      console.error("Error al cambiar contraseña:", error);
      const errorMessage = extractErrorMessage(error);
      toast.error(errorMessage);
      setErrors({ password: "El enlace puede haber expirado. Solicita uno nuevo." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordRequirements = getPasswordRequirements(password);

  return (
    <>
      <EnvironmentBanner />
      <div className="min-h-screen bg-gradient-hero dark:bg-gradient-hero-dark flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-2 mb-8">
            <div className="flex items-center space-x-2">
              <div className="h-10 rounded-lg flex items-center justify-center">
                <img
                  src="/logoNegro.png"
                  alt="EPEFI Logo"
                  className="h-20"
                />
              </div>
            </div>
          </Link>
        </div>

        <Card className="shadow-2xl border-0 card-gradient">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-primary">
                Panel de Administrador
              </span>
            </div>
            <CardTitle className="text-2xl font-bold text-center text-foreground">
              {isResetMode ? "Restablecer contraseña" : "Recuperar contraseña"}
            </CardTitle>
            <p className="text-center text-muted-foreground">
              {isResetMode
                ? "Ingresa tu nueva contraseña"
                : emailSent
                ? "Revisa tu correo para continuar"
                : "Ingresa tu email para recibir el enlace de recuperación"}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {!isResetMode ? (
              <>
                {!emailSent ? (
                  <form onSubmit={handleRequestReset} className="space-y-4">
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
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (errors.email) setErrors({ ...errors, email: "" });
                          }}
                          disabled={isSubmitting}
                        />
                      </div>
                      {errors.email && <p className="form-error">{errors.email}</p>}
                    </div>

                    <Button
                      type="submit"
                      className="w-full btn-gradient dark:btn-gradient-dark hover:opacity-90 transition-all duration-200 font-medium"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        "Enviar enlace de recuperación"
                      )}
                    </Button>
                  </form>
                ) : (
                  <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Hemos enviado un enlace de recuperación a <strong>{email}</strong>.
                      Revisa tu correo y haz clic en el enlace para restablecer tu contraseña.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEmailSent(false);
                        setEmail("");
                      }}
                      className="w-full"
                    >
                      Enviar a otro email
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="form-label">
                    Nueva contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Tu nueva contraseña"
                      className={`pl-10 pr-10 form-input ${
                        errors.password ? "border-destructive ring-destructive" : ""
                      }`}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors({ ...errors, password: "" });
                      }}
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

                  {password.length > 0 && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg border">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Requisitos de la contraseña:
                      </p>
                      <div className="space-y-1 text-xs">
                        <div className={passwordRequirements.minLength ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
                          • Al menos 8 caracteres
                        </div>
                        <div className={passwordRequirements.hasUppercase ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
                          • Una letra mayúscula
                        </div>
                        <div className={passwordRequirements.hasNumber ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
                          • Al menos un número
                        </div>
                        <div className={passwordRequirements.hasSpecialChar ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
                          • Un carácter especial (!@#$%^&*)
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="form-label">
                    Confirmar contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirma tu nueva contraseña"
                      className={`pl-10 pr-10 form-input ${
                        errors.confirmPassword ? "border-destructive ring-destructive" : ""
                      }`}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" });
                      }}
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
                  {errors.confirmPassword && (
                    <p className="form-error">{errors.confirmPassword}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full btn-gradient dark:btn-gradient-dark hover:opacity-90 transition-all duration-200 font-medium"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cambiando contraseña...
                    </>
                  ) : (
                    "Restablecer contraseña"
                  )}
                </Button>
              </form>
            )}

            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-primary hover:underline transition-colors"
              >
                ← Volver al inicio de sesión
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
};

export default ForgotPassword;

