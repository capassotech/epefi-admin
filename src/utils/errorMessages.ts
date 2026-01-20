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

