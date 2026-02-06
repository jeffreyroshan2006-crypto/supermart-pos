// Build script - Uses esbuild from devDependencies
import { build as viteBuild } from "vite";
import { rm } from "fs/promises";
import { build as esbuild } from "esbuild";

// server deps to bundle
const allowlist = [
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-session",
  "memorystore",
  "passport",
  "passport-local",
  "pg",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  
  const pkg = await import("../package.json", { assert: { type: "json" } });
  const allDeps = [
    ...Object.keys(pkg.default.dependencies || {}),
    ...Object.keys(pkg.default.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    minify: true,
    external: externals,
    logLevel: "info",
  });
  
  console.log("build complete!");
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
