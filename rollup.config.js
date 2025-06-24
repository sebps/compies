import dts from "rollup-plugin-dts";
import del from "rollup-plugin-delete";

export default {
  input: "temp/index.d.ts", // The main declaration file
  output: {
    file: "dist/index.d.ts", // The bundled declaration file
    format: "es",
  },
  plugins: [
    dts({
      compilerOptions: {
        preserveSymlinks: false,
      },
    }),
    del({ 
      targets: "temp", 
      hook: "closeBundle" 
    })
  ],
  external: [/\.css$/], // Ignore all .css imports
};
