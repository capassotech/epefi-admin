/**
 * Extrae un mensaje de error legible desde `response.data` (Express, FastAPI, etc.).
 */
export function extractAxiosResponseDataMessage(data: unknown): string | null {
  if (data == null || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;

  const asTrimmedString = (v: unknown): string | null =>
    typeof v === "string" && v.trim() ? v.trim() : null;

  const fromDetail = (): string | null => {
    const detail = d.detail;
    const s = asTrimmedString(detail);
    if (s) return s;
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0] as Record<string, unknown>;
      if (first && typeof first.msg === "string" && first.msg.trim()) {
        return first.msg.trim();
      }
    }
    return null;
  };

  const fromNestedError = (): string | null => {
    const err = d.error;
    if (err !== null && typeof err === "object" && !Array.isArray(err)) {
      const o = err as Record<string, unknown>;
      return (
        asTrimmedString(o.message) ??
        asTrimmedString(o.error) ??
        asTrimmedString(o.msg) ??
        null
      );
    }
    return null;
  };

  return (
    asTrimmedString(d.error) ??
    fromNestedError() ??
    asTrimmedString(d.message) ??
    asTrimmedString(d.msg) ??
    fromDetail() ??
    null
  );
}

/**
 * Heurística: el backend respondió que el email ya está registrado / en uso.
 */
export function isDuplicateEmailRegistrationError(
  message: string,
  httpStatus?: number
): boolean {
  const m = message.toLowerCase();

  if (
    httpStatus === 409 &&
    (m.includes("email") ||
      m.includes("e-mail") ||
      m.includes("correo") ||
      m.includes("mail") ||
      m.includes("usuario") ||
      m.includes("unique") ||
      m.includes("duplicate") ||
      m.includes("duplicado"))
  ) {
    return true;
  }

  const patterns = [
    "email ya",
    "correo ya",
    "ya está registrado",
    "ya existe un",
    "ya existe el",
    "usuario con este email",
    "usuario con este correo",
    "mail ya",
    "already in use",
    "already exists",
    "email-already",
    "email already",
    "duplicate key",
    "duplicado",
    "unique constraint",
    "email exists",
    "el email",
    "este email",
    "este correo",
    "email_taken",
    "email taken",
    "e11000",
    "duplicate entry",
  ];

  if (patterns.some((p) => m.includes(p))) return true;

  if (
    (m.includes("email") || m.includes("correo") || m.includes("e-mail")) &&
    (m.includes("existe") ||
      m.includes("registrado") ||
      m.includes(" en uso") ||
      m.includes("uso.") ||
      m.includes("duplicate") ||
      m.includes("unique") ||
      m.includes("not unique"))
  ) {
    return true;
  }

  return false;
}

/**
 * Traduce códigos de error de Firebase a mensajes amigables en español
 */
export function getFirebaseErrorMessage(error: any): string {
  // Si ya es un mensaje de error amigable, devolverlo directamente
  if (error?.message && !error?.code) {
    return error.message;
  }

  const errorCode = error?.code || error?.error?.code || "";

  const errorMessages: Record<string, string> = {
    // Errores de autenticación
    "auth/invalid-credential": "Credenciales incorrectas",
    "auth/invalid-email": "Email inválido",
    "auth/user-disabled": "Cuenta deshabilitada",
    "auth/user-not-found": "Usuario no encontrado",
    "auth/wrong-password": "Contraseña incorrecta",
    "auth/email-already-in-use": "El email ya está en uso",
    "auth/weak-password": "Contraseña muy débil",
    "auth/operation-not-allowed": "Operación no permitida",
    "auth/too-many-requests": "Demasiados intentos. Intenta más tarde",
    "auth/network-request-failed": "Error de conexión",
    "auth/invalid-verification-code": "Código de verificación inválido",
    "auth/invalid-verification-id": "ID de verificación inválido",
    "auth/code-expired": "Código expirado",
    "auth/session-expired": "Sesión expirada",
    "auth/requires-recent-login": "Vuelve a iniciar sesión",
    "auth/popup-closed-by-user": "Ventana cerrada",
    "auth/cancelled-popup-request": "Solicitud cancelada",
    "auth/popup-blocked": "Ventana bloqueada",
    "auth/account-exists-with-different-credential": "Cuenta ya existe con otro método",
    "auth/credential-already-in-use": "Credencial ya en uso",
    "auth/invalid-action-code": "Código de acción inválido",
    "auth/expired-action-code": "Código de acción expirado",
    "auth/invalid-continue-uri": "URL de continuación inválida",
    "auth/missing-continue-uri": "Falta URL de continuación",
    "auth/configuration-not-found": "Configuración de Firebase no encontrada",
    "auth/unauthorized-domain": "Dominio no autorizado",
    "auth/invalid-api-key": "Clave API inválida",
    "auth/app-not-authorized": "App no autorizada",
    "auth/argument-error": "Error en los argumentos",
    "auth/invalid-phone-number": "Número de teléfono inválido",
    "auth/missing-phone-number": "Falta número de teléfono",
    "auth/quota-exceeded": "Cuota excedida",
    "auth/credential-mismatch": "Credenciales no coinciden",
    "auth/missing-or-invalid-nonce": "Nonce faltante o inválido",
    "auth/timeout": "Tiempo de espera agotado",
    "auth/internal-error": "Error interno del servidor",
  };

  // Si encontramos el código, devolver el mensaje traducido
  if (errorCode && errorMessages[errorCode]) {
    return errorMessages[errorCode];
  }

  // Si hay un mensaje de error del backend, intentar extraerlo
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }

  if (error?.error) {
    return typeof error.error === "string" ? error.error : error.error.message || "Error desconocido";
  }

  // Si hay un mensaje genérico, usarlo
  if (error?.message) {
    return error.message;
  }

  // Mensaje por defecto
  return "Error al procesar la solicitud";
}

/**
 * Extrae el mensaje de error de una respuesta de error de forma consistente
 */
export function extractErrorMessage(error: any): string {
  // Intentar obtener mensaje de Firebase primero
  const firebaseMessage = getFirebaseErrorMessage(error);
  if (firebaseMessage && firebaseMessage !== "Error al procesar la solicitud") {
    return firebaseMessage;
  }

  // Intentar obtener del response del backend
  if (error?.response?.data?.error) {
    return typeof error.response.data.error === "string"
      ? error.response.data.error
      : error.response.data.error.message || "Error del servidor";
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  // Intentar obtener del objeto error directamente
  if (error?.error) {
    if (typeof error.error === "string") {
      return error.error;
    }
    if (error.error?.message) {
      return error.error.message;
    }
  }

  // Mensaje genérico
  if (error?.message) {
    return error.message;
  }

  return "Error desconocido";
}

