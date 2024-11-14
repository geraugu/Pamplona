// eslint.config.js
import js from "@eslint/js";

export default [
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        // Defina as variáveis globais que você precisa, ex:
        window: "readonly",
        document: "readonly",
      },
    },
    plugins: {
    },
    rules: {
      ...js.configs.recommended.rules,
      // Adicione suas próprias regras personalizadas aqui
    },
  },
];
