const path = require("node:path");
const esbuild = require("esbuild");

esbuild.build({
  entryPoints: [path.join(__dirname, "..", "src", "browser", "codemirror-entry.js")],
  bundle: true,
  outfile: path.join(__dirname, "..", "public", "codemirror-bundle.js"),
  minify: true,
  sourcemap: false,
  platform: "browser",
  format: "iife",
  target: ["es2020"]
}).catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
