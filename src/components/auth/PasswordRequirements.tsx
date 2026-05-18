import { Check, X } from "lucide-react";
import {
  PASSWORD_CHECKLIST_LABELS,
  PASSWORD_RULE_ORDER,
  type PasswordRequirementStatus,
} from "@/utils/passwordValidation";

export const PasswordRequirements = ({
  passwordRequirements,
}: {
  passwordRequirements: PasswordRequirementStatus;
}) => {
  const allMet = PASSWORD_RULE_ORDER.every((k) => passwordRequirements[k]);

  return (
    <div
      className={`mt-3 p-3 bg-muted/50 rounded-lg border ${
        allMet ? "border-green-500" : "border-border"
      }`}
    >
      <p className="text-xs font-medium text-muted-foreground mb-2">
        Requisitos de la contraseña:
      </p>
      <div className="space-y-1">
        {PASSWORD_RULE_ORDER.map((key) => {
          const met = passwordRequirements[key];
          return (
            <div key={key} className="flex items-center space-x-2">
              {met ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <X className="h-3 w-3 text-red-500" />
              )}
              <span
                className={`text-xs ${
                  met
                    ? "text-green-700 dark:text-green-400"
                    : "text-muted-foreground"
                }`}
              >
                {PASSWORD_CHECKLIST_LABELS[key]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
