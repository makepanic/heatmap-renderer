import typescript from "@rollup/plugin-typescript";
import { getBabelOutputPlugin } from "@rollup/plugin-babel";

export default {
  input: "index.ts",
  output: {
    dir: "dist",
    name: "heatmap-renderer",
    format: "cjs",
  },
  plugins: [
    typescript(),
    getBabelOutputPlugin({
      presets: [
        [
          "@babel/preset-env",
          {
            targets: {
              esmodules: true,
            },
          },
        ],
      ],
    }),
  ],
};
