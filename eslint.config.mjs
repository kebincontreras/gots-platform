import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"

// Configuración mínima para que `npm run lint` funcione con ESLint 9 / Next 16.
// Las reglas que el código heredado incumple de forma masiva (any explícito,
// setState dentro de effects, <a> en lugar de <Link>...) quedan como aviso:
// se siguen viendo en la salida, pero no bloquean. Se pueden ir endureciendo
// cuando se limpie cada una.
const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [".next/**", "out/**", "node_modules/**", "my-v0-project@0.1.0/**", "next/**", "pnpm/**", "python/**"],
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@next/next/no-html-link-for-pages": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
    },
  },
  {
    // Scripts de Node en CommonJS (create-professor, set-role, ...).
    files: ["scripts/**/*.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  {
    // Los .mjs de Labs son de otra mano y mezclan estilos: se revisan aparte.
    files: ["lib/**/*.mjs"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
]

export default eslintConfig
