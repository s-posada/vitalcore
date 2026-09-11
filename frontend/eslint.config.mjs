import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  globalIgnores([".next/**", "node_modules/**", "next-env.d.ts"]),
  {
    // El prototipo admite avatares externos dinámicos que no pueden declararse
    // de antemano en remotePatterns de next/image.
    rules: {
      "@next/next/no-img-element": "off",
      "@next/next/no-location-assign-relative-destination": "off",
      // El estado de sesión demo se hidrata deliberadamente desde localStorage.
      // Se retirarán estas excepciones al migrar la sesión a cookies HttpOnly.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
    },
  },
]);
