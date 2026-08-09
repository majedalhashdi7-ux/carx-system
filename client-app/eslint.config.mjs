// [[ARABIC_HEADER]] هذا الملف (client-app/eslint.config.mjs) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

import { defineConfig, globalIgnores } from "eslint/config";

// استخدام الاستيراد الديناميكي لتجنب أخطاء المسار في بيئة Vercel
const { default: nextConfig } = await import("eslint-config-next");

const eslintConfig = defineConfig([
  ...(Array.isArray(nextConfig) ? nextConfig : [nextConfig]),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { "varsIgnorePattern": "^_", "argsIgnorePattern": "^_" }],
      "react/no-unescaped-entities": "off",
    }
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
