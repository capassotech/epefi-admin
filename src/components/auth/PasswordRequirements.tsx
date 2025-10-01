import { Check, X } from "lucide-react";



export const PasswordRequirements = ({
    passwordRequirements,
}: {
    passwordRequirements: {
        minLength: boolean;
        hasUppercase: boolean;
        hasSpecialChar: boolean;
        hasNumber: boolean;
    };
}) => {
    return (
        <div className={`mt-3 p-3 bg-muted/50 rounded-lg border 
        ${passwordRequirements.minLength && passwordRequirements.hasUppercase && passwordRequirements.hasNumber && passwordRequirements.hasSpecialChar
                ? 'border-green-500'
                : 'border-border '}`
        }>
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
                    <span className={`text-xs ${passwordRequirements.minLength ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'}`}>
                        Al menos 8 caracteres
                    </span>
                </div>
                <div className="flex items-center space-x-2">
                    {passwordRequirements.hasUppercase ? (
                        <Check className="h-3 w-3 text-green-500" />
                    ) : (
                        <X className="h-3 w-3 text-red-500" />
                    )}
                    <span className={`text-xs ${passwordRequirements.hasUppercase ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'}`}>
                        Una letra mayúscula
                    </span>
                </div>
                <div className="flex items-center space-x-2">
                    {passwordRequirements.hasNumber ? (
                        <Check className="h-3 w-3 text-green-500" />
                    ) : (
                        <X className="h-3 w-3 text-red-500" />
                    )}
                    <span className={`text-xs ${passwordRequirements.hasNumber ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'}`}>
                        Al menos un número
                    </span>
                </div>
                <div className="flex items-center space-x-2">
                    {passwordRequirements.hasSpecialChar ? (
                        <Check className="h-3 w-3 text-green-500" />
                    ) : (
                        <X className="h-3 w-3 text-red-500" />
                    )}
                    <span className={`text-xs ${passwordRequirements.hasSpecialChar ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'}`}>
                        Un carácter especial (!@#$%^&*)
                    </span>
                </div>
            </div>
        </div>
    );
};