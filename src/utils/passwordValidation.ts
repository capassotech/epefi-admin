/** Política única de contraseña (panel admin y flujos asociados). */

export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_REQUIRED_MESSAGE = "La contraseña es requerida";

const SPECIAL_CHAR_RE = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

export type PasswordRequirementKey =
  | "minLength"
  | "hasUppercase"
  | "hasNumber"
  | "hasSpecialChar";

export type PasswordRequirementStatus = Record<PasswordRequirementKey, boolean>;

export const PASSWORD_RULE_ORDER = [
  "minLength",
  "hasUppercase",
  "hasNumber",
  "hasSpecialChar",
] as const satisfies readonly PasswordRequirementKey[];

/** Textos de la lista de requisitos (UI checklist). */
export const PASSWORD_CHECKLIST_LABELS: Record<PasswordRequirementKey, string> = {
  minLength: "Al menos 8 caracteres",
  hasUppercase: "Al menos una mayúscula",
  hasNumber: "Al menos un número",
  hasSpecialChar: "Un carácter especial (!@#$%^&*)",
};

/** Mensajes de error por regla incumplida (orden fijo). */
export const PASSWORD_RULE_MESSAGES: Record<PasswordRequirementKey, string> = {
  minLength: "Debe tener al menos 8 caracteres",
  hasUppercase: "Debe incluir una mayúscula",
  hasNumber: "Debe incluir un número",
  hasSpecialChar: "Debe incluir un carácter especial",
};

export function getPasswordRequirementStatus(
  password: string
): PasswordRequirementStatus {
  return {
    minLength: password.length >= PASSWORD_MIN_LENGTH,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: SPECIAL_CHAR_RE.test(password),
  };
}

/** Contraseña no vacía y cumple todas las reglas. */
export function isPasswordPolicySatisfied(password: string): boolean {
  const trimmed = password.trim();
  if (!trimmed) return false;
  const status = getPasswordRequirementStatus(trimmed);
  return PASSWORD_RULE_ORDER.every((k) => status[k]);
}

export type PasswordValidationResult = {
  /** Cadena vacía o solo espacios. */
  isEmpty: boolean;
  /** No vacía y cumple todas las reglas. */
  isValid: boolean;
  /** Mensajes de reglas que no se cumplen (vacío si isEmpty o isValid). */
  ruleViolationMessages: string[];
};

/**
 * Valida la política de contraseña (no considera "requerido": una cadena vacía
 * devuelve isEmpty: true e isValid: false sin mensajes de reglas).
 */
export function validatePassword(password: string): PasswordValidationResult {
  const trimmed = password.trim();
  if (!trimmed) {
    return { isEmpty: true, isValid: false, ruleViolationMessages: [] };
  }
  const status = getPasswordRequirementStatus(trimmed);
  const ruleViolationMessages = PASSWORD_RULE_ORDER.filter((k) => !status[k]).map(
    (k) => PASSWORD_RULE_MESSAGES[k]
  );
  return {
    isEmpty: false,
    isValid: ruleViolationMessages.length === 0,
    ruleViolationMessages,
  };
}
