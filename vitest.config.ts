import { defineConfig } from "vitest/config";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    environment: "node",
    include: ["server/**/*.test.ts", "server/**/*.spec.ts"],
    // 테스트는 DB 없이 돈다. 셸의 DATABASE_URL이 있어도 여기의 빈 값으로 덮어써서
    // 실제 DB에 절대 닿지 않는다.
    env: {
      DATABASE_URL: "",
    },
  },
});
