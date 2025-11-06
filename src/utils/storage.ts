/**
 * Utilidades para manejo seguro de almacenamiento local
 * Maneja errores de espacio en disco y otros problemas de almacenamiento
 */

import { toast } from "sonner";

interface StorageError extends Error {
  code?: string;
  name: string;
}

/**
 * Intenta guardar datos en localStorage con manejo de errores
 * @param key - Clave del almacenamiento
 * @param value - Valor a guardar (será convertido a JSON)
 * @returns true si se guardó correctamente, false en caso contrario
 */
export function safeSetItem(key: string, value: any): boolean {
  try {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
    return true;
  } catch (error: any) {
    const storageError = error as StorageError;
    
    // Verificar si es un error de espacio
    if (
      storageError.name === 'QuotaExceededError' ||
      storageError.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      storageError.message?.includes('QUOTA') ||
      storageError.message?.includes('quota') ||
      storageError.message?.includes('FILE_ERROR_NO_SPACE') ||
      storageError.message?.includes('no space')
    ) {
      console.error('❌ Error: Espacio de almacenamiento agotado');
      
      // Intentar limpiar datos antiguos
      try {
        clearOldStorageData();
        
        // Intentar guardar nuevamente después de limpiar
        const serializedValue = JSON.stringify(value);
        localStorage.setItem(key, serializedValue);
        console.log('✅ Datos guardados después de limpiar almacenamiento');
        return true;
      } catch (retryError) {
        console.error('❌ Error persistente al guardar después de limpiar:', retryError);
        // Mostrar notificación al usuario
        showStorageErrorNotification();
        return false;
      }
    }
    
    // Otros errores de almacenamiento
    console.error('❌ Error al guardar en localStorage:', storageError);
    return false;
  }
}

/**
 * Obtiene datos de localStorage de forma segura
 * @param key - Clave del almacenamiento
 * @returns El valor parseado o null si hay error
 */
export function safeGetItem<T = any>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return null;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`❌ Error al leer ${key} de localStorage:`, error);
    return null;
  }
}

/**
 * Elimina un item de localStorage de forma segura
 * @param key - Clave del almacenamiento
 */
export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`❌ Error al eliminar ${key} de localStorage:`, error);
  }
}

/**
 * Limpia datos antiguos del almacenamiento para liberar espacio
 */
function clearOldStorageData(): void {
  try {
    // Lista de claves que se pueden limpiar si es necesario
    const keysToCheck = [
      'pendingSubjectData',
      'lastCourseAccess',
      'lastViewedClass',
      // Agregar otras claves temporales aquí
    ];

    // Eliminar datos temporales antiguos
    keysToCheck.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          // Verificar si el dato es antiguo (más de 7 días)
          const data = JSON.parse(item);
          if (data.timestamp) {
            const daysSince = (Date.now() - new Date(data.timestamp).getTime()) / (1000 * 60 * 60 * 24);
            if (daysSince > 7) {
              localStorage.removeItem(key);
              console.log(`🗑️ Eliminado dato antiguo: ${key}`);
            }
          }
        }
      } catch (e) {
        // Si hay error, simplemente eliminar el item
        localStorage.removeItem(key);
      }
    });

    // Limpiar datos de sesión si existen
    const sessionKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('session_') || key.startsWith('temp_')
    );
    sessionKeys.forEach(key => localStorage.removeItem(key));
    
    console.log('🧹 Limpieza de almacenamiento completada');
  } catch (error) {
    console.error('❌ Error durante la limpieza de almacenamiento:', error);
  }
}

/**
 * Muestra una notificación al usuario sobre el error de almacenamiento
 */
function showStorageErrorNotification(): void {
  toast.error(
    "El almacenamiento del navegador está lleno",
    {
      description: "Por favor, libera espacio limpiando los datos del navegador o usa otro navegador.",
      duration: 10000,
    }
  );
  
  // También mostrar en consola para debugging
  console.warn('⚠️ ADVERTENCIA: El almacenamiento del navegador está lleno. Se recomienda:');
  console.warn('1. Limpiar datos del navegador (Configuración > Privacidad > Borrar datos)');
  console.warn('2. Cerrar otras pestañas que puedan estar usando mucho almacenamiento');
  console.warn('3. Reiniciar el navegador');
}

/**
 * Verifica si hay espacio disponible en el almacenamiento
 * @returns true si hay espacio disponible, false en caso contrario
 */
export function checkStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (error: any) {
    const storageError = error as StorageError;
    if (
      storageError.name === 'QuotaExceededError' ||
      storageError.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      storageError.message?.includes('QUOTA')
    ) {
      return false;
    }
    return false;
  }
}

/**
 * Obtiene el tamaño aproximado del almacenamiento usado
 * @returns Tamaño en bytes aproximado
 */
export function getStorageSize(): number {
  let total = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length;
    }
  }
  return total;
}

