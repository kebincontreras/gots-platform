# GOTS.github.io

Sitio web (Next.js) del grupo GOTS.

## Login/registro (v1)
Este repo incluye una versión inicial para:
- Registro e inicio de sesión por usuario (cuentas privadas).
- Panel de estudiante (`/dashboard`) para pegar el enlace embebible de Google Drive de su presentación.
- Panel del profesor (`/profesor`) para ver la lista de estudiantes y abrir la presentación de cada uno.

### Importante (deploy)
Si quieres cuentas y login, **no puedes publicar esto como GitHub Pages / static export**. Necesitas un deploy con servidor (por ejemplo Vercel o un servidor propio).

## Desarrollo local
1) Instala dependencias:
   - `npm install`
2) Crea tu env:
   - Copia `.env.example` a `.env.local` y edita `NEXTAUTH_SECRET`.
3) Ejecuta:
   - `npm run dev`
4) Abre:
   - `http://localhost:3000`

## Crear cuenta de profesor
El profesor no se crea automáticamente. Crea una cuenta con este comando:

- `PROF_NAME="Profesor" PROF_EMAIL="prof@example.com" PROF_PASSWORD="password-largo" npm run create-professor`

Luego inicia sesión con ese email/contraseña y entra a `/profesor`.
