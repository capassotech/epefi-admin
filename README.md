# EPEFI Admin

Panel administrativo de la plataforma EPEFI.

## 🚀 Inicio Rápido

```sh
npm i
cp env.local .env  # Usa env.qa o env.production según necesites
npm run dev
```

## 🔧 Configuración de Entornos

El proyecto soporta **QA** y **Producción** mediante variables de entorno.

### Archivos de Configuración

- `env.local` - Configuración para desarrollo local (usa datos de QA)
- `env.qa` - Configuración para entorno QA
- `env.production` - Configuración para producción

**Para desarrollo local:** Copia `env.local` a `.env`:
```sh
cp env.local .env
```

### Variables Requeridas

- `VITE_FIREBASE_API_KEY_QA` / `VITE_FIREBASE_API_KEY_PROD`
- `VITE_FIREBASE_AUTH_DOMAIN_QA` / `VITE_FIREBASE_AUTH_DOMAIN_PROD`
- `VITE_FIREBASE_PROJECT_ID_QA` / `VITE_FIREBASE_PROJECT_ID_PROD`
- `VITE_FIREBASE_STORAGE_BUCKET_QA` / `VITE_FIREBASE_STORAGE_BUCKET_PROD`
- `VITE_FIREBASE_MESSAGING_SENDER_ID_QA` / `VITE_FIREBASE_MESSAGING_SENDER_ID_PROD`
- `VITE_FIREBASE_APP_ID_QA` / `VITE_FIREBASE_APP_ID_PROD`
- `VITE_FIREBASE_MEASUREMENT_ID_QA` / `VITE_FIREBASE_MEASUREMENT_ID_PROD`
- `VITE_API_URL` - URL del backend
- `VITE_ENVIRONMENT` - `qa` o `prod` (se establece automáticamente en CI/CD)

### Indicador Visual

Cuando el entorno es **QA**, se muestra un banner "ENTORNO PARA PRUEBAS" en la esquina superior derecha.

### CI/CD (GitHub Actions)

Los despliegues automáticos usan GitHub Secrets con sufijos `_QA` y `_PROD`:
- `VITE_FIREBASE_API_KEY_QA`, `VITE_FIREBASE_API_KEY_PROD`
- `VITE_FIREBASE_AUTH_DOMAIN_QA`, `VITE_FIREBASE_AUTH_DOMAIN_PROD`
- ... (mismo patrón para todas las variables)

## 📦 Tecnologías

- Vite + TypeScript + React
- shadcn-ui + Tailwind CSS
- Firebase (Auth, Storage, Firestore)
