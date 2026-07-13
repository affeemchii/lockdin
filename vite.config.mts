import { defineConfig } from "vite";
import { gadget } from "gadget-server/vite";
import { reactRouter } from "@react-router/dev/vite";

export default defineConfig({
  plugins: [gadget(), reactRouter()],
  define: {
    "process.env.SHOPIFY_API_KEY": JSON.stringify("19363d7f4de57a8eebeebaeb22c5ec8b"),
  },
});