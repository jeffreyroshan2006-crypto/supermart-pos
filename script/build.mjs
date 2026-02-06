// Build script - Uses npx to ensure esbuild is available
import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";
import { execSync } from "child_process";

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
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  // Use npx to run esbuild
  const externalArgs = externals.map(e => `--external:${e}`).join(' ');
  const command = `npx esbuild server/index.ts --platform=node --bundle --format=cjs --outfile=dist/index.cjs --minify ${externalArgs}`;
  
  console.log("Running:", command);
  execSync(command, { stdio: 'inherit' });
  
  console.log("build complete!");
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
