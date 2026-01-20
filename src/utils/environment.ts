/**
 * Detecta si estamos en un entorno de desarrollo/testing (local o QA)
 * @returns true si estamos en local o QA, false si estamos en producción
 */
export function isDevelopmentOrQA(): boolean {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  
  // Verificar producción por projectId O authDomain
  const isProduction = 
    projectId === "epefi-admin" || 
    authDomain === "epefi-admin.firebaseapp.com";
  
  if (isProduction) {
    console.log("🔒 Entorno de producción detectado - Crear primer admin deshabilitado", {
      projectId,
      authDomain
    });
    return false;
  }
  
  // Verificar QA por projectId O authDomain
  const isQA = 
    projectId === "epefi-admin-qa" || 
    authDomain === "epefi-admin-qa.firebaseapp.com";
  
  if (isQA) {
    console.log("🧪 Entorno de QA detectado - Crear primer admin habilitado", {
      projectId,
      authDomain
    });
    return true;
  }
  
  // Si no hay projectId definido o es otro valor, asumimos que es local - SÍ mostrar
  // Esto cubre el caso de desarrollo local sin variables de entorno configuradas
  console.log("💻 Entorno local detectado - Crear primer admin habilitado", {
    projectId,
    authDomain
  });
  return true;
}

/**
 * Detecta si estamos en producción
 * @returns true si estamos en producción, false si estamos en local o QA
 */
export function isProduction(): boolean {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  
  return (
    projectId === "epefi-admin" || 
    authDomain === "epefi-admin.firebaseapp.com"
  );
}

