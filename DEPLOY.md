# Guía de Despliegue en GitHub Pages

## Pasos para publicar tu sitio web

### 1. Crear el repositorio en GitHub
- Ve a GitHub y crea un nuevo repositorio
- Nómbralo `GOTS.github.io` (o el nombre que prefieras)
- No inicialices con README, .gitignore o licencia

### 2. Subir el código al repositorio

Abre una terminal en la carpeta de tu proyecto y ejecuta:

\`\`\`bash
git init
git add .
git commit -m "Initial commit: GOTS website"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/GOTS.github.io.git
git push -u origin main
\`\`\`

**Importante:** Reemplaza `TU-USUARIO` con tu nombre de usuario de GitHub.

### 3. Configurar GitHub Pages

1. Ve a tu repositorio en GitHub
2. Haz clic en **Settings** (Configuración)
3. En el menú lateral, haz clic en **Pages**
4. En **Source**, selecciona **GitHub Actions**

### 4. Esperar el despliegue

- El workflow se ejecutará automáticamente
- Puedes ver el progreso en la pestaña **Actions** de tu repositorio
- Cuando termine (marca verde ✓), tu sitio estará disponible en:
  `https://TU-USUARIO.github.io/GOTS.github.io/`

### 5. Actualizar el basePath (si usas otro nombre de repositorio)

Si nombraste tu repositorio diferente a `GOTS.github.io`, debes actualizar el archivo `next.config.mjs`:

\`\`\`javascript
basePath: process.env.NODE_ENV === 'production' ? '/NOMBRE-DE-TU-REPO' : '',
\`\`\`

## Actualizaciones futuras

Cada vez que hagas cambios y los subas a GitHub:

\`\`\`bash
git add .
git commit -m "Descripción de tus cambios"
git push
\`\`\`

El sitio se actualizará automáticamente en unos minutos.

## Solución de problemas

- **El sitio no carga los estilos:** Verifica que el `basePath` en `next.config.mjs` coincida con el nombre de tu repositorio
- **Error 404:** Asegúrate de haber configurado GitHub Pages para usar GitHub Actions
- **El workflow falla:** Revisa los logs en la pestaña Actions para ver el error específico
\`\`\`

```json file="" isHidden
