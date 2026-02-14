/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const pkgJsonPath = process.env.npm_package_json;
let pkgDir = process.cwd();
if (pkgJsonPath) {
  try {
    pkgDir = path.dirname(fs.realpathSync(pkgJsonPath));
  } catch {
    pkgDir = path.dirname(pkgJsonPath);
  }
}

const inputPath = path.join(pkgDir, "src", "styles.css");
const outputPath = path.join(pkgDir, "public", "styles.css");

try {
  fs.accessSync(inputPath, fs.constants.R_OK);
} catch {
  console.error(`Error: missing CSS entrypoint: ${inputPath}`);
  process.exit(1);
}

const binName = process.platform === "win32" ? "postcss.cmd" : "postcss";
const postcssBin = path.join(pkgDir, "node_modules", ".bin", binName);

if (!fs.existsSync(postcssBin)) {
  console.error(`Error: postcss binary not found: ${postcssBin}`);
  console.error("Make sure postcss-cli is installed (as a dependency on production hosts).");
  process.exit(1);
}

const res = spawnSync(postcssBin, [inputPath, "-o", outputPath], {
  stdio: "inherit",
  cwd: pkgDir,
  // Tailwind v4 uses a Rust engine that initializes a Rayon thread pool. On some
  // shared hosts (tight thread/process limits), the default thread count can
  // fail with EAGAIN. Default to 1 thread unless the user overrides it.
  env: { ...process.env, RAYON_NUM_THREADS: process.env.RAYON_NUM_THREADS || "1" },
});
process.exit(res.status ?? 1);
