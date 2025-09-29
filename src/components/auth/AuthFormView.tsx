import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  BadgeIcon as IdCard,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { PasswordRequirements } from "./PasswordRequirements";

export default function AuthFormView({
  isLogin = false,
  currentStep = 1,
  showEmailForm = false,
  onSubmit,
  onGoogleAuth,
  onInputChange,
  onStepChange,
  onEmailMethodSelect,
  errors,
  formData,
  isSubmitting,
  showPassword,
  setShowPassword,
  passwordRequirements,
}: {
  isLogin?: boolean;
  currentStep?: number;
  showEmailForm?: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onGoogleAuth: () => void;
  onInputChange: (field: string, value: string | boolean) => void;
  onStepChange?: (step: number) => void;
  onEmailMethodSelect?: () => void;
  errors: Record<string, string>;
  formData: Record<string, string | boolean>;
  isSubmitting: boolean;
  showPassword: boolean;
  setShowPassword: (showPassword: boolean) => void;
  passwordRequirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasSpecialChar: boolean;
    hasNumber: boolean;
  };
}) {
  const isStep1Valid = () => {
    if (isLogin) return true;
    // return (
    //     (formData.firstName as string)?.trim().length >= 2 &&
    //     (formData.lastName as string)?.trim().length >= 2 &&
    //     (formData.dni as string)?.length >= 7 &&
    //     formData.acceptTerms === true
    // );
  };

  const getStepTitle = () => {
    if (isLogin) return "Iniciar Sesión";

    // switch (currentStep) {
    //     case 1: return "Crear Cuenta - Paso 1";
    //     case 2: return "Crear Cuenta - Paso 2";
    //     default: return "Crear Cuenta";
    // }
  };

  const getStepDescription = () => {
    if (isLogin) return "Ingresa a tu cuenta para continuar";

    // switch (currentStep) {
    //     case 1: return "Ingresa tus datos personales";
    //     case 2: return "Elige cómo quieres registrarte";
    //     default: return "Únete a nuestra comunidad";
    // }
  };

  const renderStep1 = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="form-label">
            Nombre
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="firstName"
              type="text"
              placeholder="Tu nombre"
              className={`pl-10 form-input ${
                errors.firstName ? "border-destructive ring-destructive" : ""
              }`}
              value={formData.firstName as string}
              onChange={(e) => onInputChange("firstName", e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          {errors.firstName && <p className="form-error">{errors.firstName}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName" className="form-label">
            Apellido
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="lastName"
              type="text"
              placeholder="Tu apellido"
              className={`pl-10 form-input ${
                errors.lastName ? "border-destructive ring-destructive" : ""
              }`}
              value={formData.lastName as string}
              onChange={(e) => onInputChange("lastName", e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          {errors.lastName && <p className="form-error">{errors.lastName}</p>}
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
            value={formData.dni as string}
            onChange={(e) => onInputChange("dni", e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        {errors.dni && <p className="form-error">{errors.dni}</p>}
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="terms"
            checked={formData.acceptTerms as boolean}
            onCheckedChange={(checked) =>
              onInputChange("acceptTerms", checked === true)
            }
            disabled={isSubmitting}
            className="border-input data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
          <Label htmlFor="terms" className="text-sm text-foreground">
            Acepto los{" "}
            <Link
              to="/terms"
              className="text-primary hover:underline transition-colors"
            >
              términos y condiciones
            </Link>{" "}
            y la{" "}
            <Link
              to="/privacy"
              className="text-primary hover:underline transition-colors"
            >
              política de privacidad
            </Link>
          </Label>
        </div>
        {errors.acceptTerms && (
          <p className="form-error">{errors.acceptTerms}</p>
        )}
      </div>

      <Button
        onClick={() => onStepChange?.(2)}
        className="w-full btn-gradient dark:btn-gradient-dark hover:opacity-90 transition-all duration-200 font-medium"
        disabled={!isStep1Valid() || isSubmitting}
      >
        Continuar
      </Button>
    </>
  );

  const renderStep2 = () => (
    <>
      {/* GOOGLE AUTH COMENTADO - REGISTRO DE ADMIN SOLO CON EMAIL/PASSWORD */}
      {/* <Button
                type="button"
                className="w-full bg-transparent border-border hover:bg-accent hover:text-accent-foreground transition-all duration-200"
                onClick={onGoogleAuth}
                disabled={isSubmitting}
                variant="outline"
            >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                </svg>
                Continuar con Google
            </Button>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-card text-muted-foreground">O</span>
                </div>
            </div> */}

      {!showEmailForm ? (
        <Button
          onClick={onEmailMethodSelect}
          className="w-full btn-gradient dark:btn-gradient-dark hover:opacity-90 transition-all duration-200 font-medium"
          disabled={isSubmitting}
        >
          Registrarme con Email y Contraseña
        </Button>
      ) : (
        <div className="space-y-4 bg-muted/30 p-4 rounded-lg border animate-in slide-in-from-top-2 duration-300">
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
                value={formData.email as string}
                onChange={(e) => onInputChange("email", e.target.value)}
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
                value={formData.password as string}
                onChange={(e) => onInputChange("password", e.target.value)}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors duration-200"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="form-error whitespace-pre-line">
                {errors.password}
              </p>
            )}

            {(formData.password as string)?.length > 0 && (
              <div
                className={`mt-3 p-3 bg-muted/50 rounded-lg border 
                                            ${
                                              passwordRequirements.minLength &&
                                              passwordRequirements.hasUppercase &&
                                              passwordRequirements.hasNumber &&
                                              passwordRequirements.hasSpecialChar
                                                ? "border-green-500"
                                                : "border-border "
                                            }`}
              >
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Requisitos de la contraseña:
                </p>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    {passwordRequirements.minLength ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <X className="h-3 w-3 text-red-500" />
                    )}
                    <span
                      className={`text-xs ${
                        passwordRequirements.minLength
                          ? "text-green-700 dark:text-green-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      Al menos 8 caracteres
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {passwordRequirements.hasUppercase ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <X className="h-3 w-3 text-red-500" />
                    )}
                    <span
                      className={`text-xs ${
                        passwordRequirements.hasUppercase
                          ? "text-green-700 dark:text-green-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      Una letra mayúscula
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {passwordRequirements.hasNumber ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <X className="h-3 w-3 text-red-500" />
                    )}
                    <span
                      className={`text-xs ${
                        passwordRequirements.hasNumber
                          ? "text-green-700 dark:text-green-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      Al menos un número
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {passwordRequirements.hasSpecialChar ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <X className="h-3 w-3 text-red-500" />
                    )}
                    <span
                      className={`text-xs ${
                        passwordRequirements.hasSpecialChar
                          ? "text-green-700 dark:text-green-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      Un carácter especial (!@#$%^&*)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button
            type="button"
            onClick={(e) => onSubmit(e as React.FormEvent)}
            className="w-full btn-gradient dark:btn-gradient-dark hover:opacity-90 transition-all duration-200 font-medium"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando cuenta...
              </>
            ) : (
              "Registrarse"
            )}
          </Button>
        </div>
      )}

      <Button
        variant="ghost"
        onClick={() => onStepChange?.(1)}
        className="w-full"
        disabled={isSubmitting}
      >
        ← Volver
      </Button>
    </>
  );

  const renderLogin = () => (
    <>
      {/* GOOGLE AUTH COMENTADO - LOGIN DE ADMIN SOLO CON EMAIL/PASSWORD */}
      {/* <Button
                type="button"
                variant="outline"
                className="w-full bg-transparent border-border hover:bg-accent hover:text-accent-foreground transition-all duration-200"
                onClick={onGoogleAuth}
                disabled={isSubmitting}
            >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                </svg>
                Continuar con Google
            </Button>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-card text-muted-foreground">
                        O continúa con email
                    </span>
                </div>
            </div> */}

      <form className="space-y-4">
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
              value={formData.email as string}
              onChange={(e) => onInputChange("email", e.target.value)}
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
              placeholder="Tu contraseña"
              className={`pl-10 pr-10 form-input ${
                errors.password ? "border-destructive ring-destructive" : ""
              }`}
              value={formData.password as string}
              onChange={(e) => onInputChange("password", e.target.value)}
              disabled={isSubmitting}
            />
            <button
              type="button"
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors duration-200"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isSubmitting}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {/* {errors.password && (
                  <p className="form-error whitespace-pre-line">{errors.password}</p>
                )} */}
        </div>

        <Button
          type="button"
          onClick={(e) => onSubmit(e as React.FormEvent)}
          className="w-full btn-gradient dark:btn-gradient-dark hover:opacity-90 transition-all duration-200 font-medium"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Iniciando sesión...
            </>
          ) : (
            "Iniciar Sesión"
          )}
        </Button>
      </form>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-hero dark:bg-gradient-hero-dark flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-2 mb-8">
            <div className="flex items-center space-x-2">
              <div className="h-10 rounded-lg flex items-center justify-center">
                <img src="/logo-blanco.png" alt="INEE Logo" className="h-20" />
              </div>
            </div>
          </Link>
        </div>

        <Card className="shadow-2xl border-0 card-gradient">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-foreground">
              {getStepTitle()}
            </CardTitle>
            <p className="text-center text-muted-foreground">
              {getStepDescription()}
            </p>
            {/* {!isLogin && currentStep > 1 && (
                            <div className="flex justify-center mt-2">
                                <div className="flex space-x-2">
                                    {[1, 2].map((step) => (
                                        <div
                                            key={step}
                                            className={`w-2 h-2 rounded-full ${step <= currentStep
                                                ? 'bg-primary'
                                                : 'bg-muted-foreground/30'
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )} */}
          </CardHeader>

          <CardContent className="space-y-6">
            {isLogin
              ? renderLogin()
              : currentStep === 1
              ? renderStep1()
              : currentStep === 2
              ? renderStep2()
              : renderStep1()}

            {isLogin && (
              <div className="text-center">
                <Link
                  to="/login"
                  className="text-sm text-primary hover:underline transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
