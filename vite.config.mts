import { defineConfig } from "vite";
import { gadget } from "gadget-server/vite";
import { reactRouter } from "@react-router/dev/vite";

export default defineConfig({
  plugins: [gadget(), reactRouter()],
  define: {
    "process.env.SHOPIFY_API_KEY": JSON.stringify("3c75a0223a59bad6761918037660c54f"),
  },
});