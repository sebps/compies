import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const title = "compies"

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "ReactTerminalLibrary",
      fileName: (format) => `${title}.${format}.js`,
    },
    rollupOptions: {
      external: ["react", "react-dom"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "index.css") {
            return `${title}.css`;
          }
          return assetInfo.name!;
        },
      },
    },
    cssCodeSplit: true, // Ensure CSS is split into its own file
  },
});
