# EPEFI Admin

Panel administrativo de la plataforma EPEFI.

## 🚀 Inicio Rápido

```sh
npm i
cp env.local .env  # Usa env.qa o env.production según necesites
npm run dev
```

## 🔧 Configuración de Entornos

El proyecto soporta **QA** y **Producción** mediante variables de entorno, cada uno con su propio backend.

### Archivos de Configuración

- `env.local` - Configuración para desarrollo local (usa backend de QA)
- `env.qa` - Configuración para entorno QA
- `env.production` - Configuración para producción

**Para desarrollo local:** Copia `env.local` a `.env`:
```sh
cp env.local .env
```

### Variables Requeridas

Cada archivo de entorno contiene las siguientes variables:

#### Variables de API (Backend)
- `VITE_API_BASE_URL` - URL del backend API
  - **QA**: `https://epefi-backend-qa.onrender.com`
  - **Producción**: `https://epefi-backend.onrender.com`

#### Variables de Firebase
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

### Scripts de Build

El proyecto incluye scripts específicos para cada entorno:

```sh
# Desarrollo
npm run dev

# Build para QA
npm run build:qa

# Build para Producción
npm run build:production

# Build por defecto (usa .env)
npm run build
```

### Indicador Visual

Cuando el entorno es **QA**, se muestra un banner "ENTORNO PARA PRUEBAS" en la esquina superior derecha.

### CI/CD (GitHub Actions)

Los despliegues automáticos se ejecutan al hacer push a las ramas:
- **develop** → Despliega a QA con backend de QA
- **main** → Despliega a Producción con backend de Producción

#### GitHub Secrets Requeridos

Para QA (rama `develop`):
- `VITE_API_BASE_URL_QA` = `https://epefi-backend-qa.onrender.com`
- `VITE_FIREBASE_API_KEY_QA`
- `VITE_FIREBASE_AUTH_DOMAIN_QA`
- `VITE_FIREBASE_PROJECT_ID_QA`
- `VITE_FIREBASE_STORAGE_BUCKET_QA`
- `VITE_FIREBASE_MESSAGING_SENDER_ID_QA`
- `VITE_FIREBASE_APP_ID_QA`
- `VITE_FIREBASE_MEASUREMENT_ID_QA`
- `FIREBASE_SERVICE_ACCOUNT_QA`

Para Producción (rama `main`):
- `VITE_API_BASE_URL_PROD` = `https://epefi-backend.onrender.com`
- `VITE_FIREBASE_API_KEY_PROD`
- `VITE_FIREBASE_AUTH_DOMAIN_PROD`
- `VITE_FIREBASE_PROJECT_ID_PROD`
- `VITE_FIREBASE_STORAGE_BUCKET_PROD`
- `VITE_FIREBASE_MESSAGING_SENDER_ID_PROD`
- `VITE_FIREBASE_APP_ID_PROD`
- `VITE_FIREBASE_MEASUREMENT_ID_PROD`
- `FIREBASE_SERVICE_ACCOUNT_PROD`

## 📦 Tecnologías

- Vite + TypeScript + React
- shadcn-ui + Tailwind CSS
- Firebase (Auth, Storage, Firestore)
- Axios para comunicación con el backend
